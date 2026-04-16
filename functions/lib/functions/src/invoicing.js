"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndSendInvoice = void 0;
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const xml2js = __importStar(require("xml2js"));
const db = admin.firestore();
/**
 * Handles the end-to-end flow of generating, signing, and sending an invoice.
 */
async function generateAndSendInvoice(userId, invoiceData) {
    // 1. Get Gym Configuration (EMISOR)
    const gymConfigDoc = await db.collection("gym_configs").doc("invoicing").get();
    if (!gymConfigDoc.exists) {
        throw new Error("La configuración fiscal del gimnasio no ha sido establecida.");
    }
    const gymConfig = gymConfigDoc.data();
    // 2. Get User Data (RECEPTOR)
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
        throw new Error("Usuario no encontrado.");
    }
    const userData = userDoc.data();
    const receptorTaxData = userData?.taxData;
    if (!receptorTaxData) {
        throw new Error("El usuario no tiene datos fiscales configurados.");
    }
    // 3. Increment Invoice Consecutivo
    const nextConsecutivo = await incrementConsecutivo();
    const clave = generateClave(gymConfig, nextConsecutivo);
    // 4. Generate XML v4.3 Structure
    const xmlObject = buildXmlObject(gymConfig, receptorTaxData, invoiceData, nextConsecutivo, clave);
    const builder = new xml2js.Builder();
    const rawXml = builder.buildObject(xmlObject);
    // 5. Sign XML (XAdES-EPES)
    // NOTE: This usually requires the P12 certificate stored in Secrets Manager
    // For now, we simulate or use a library call if setup properly
    const signedXml = await signXmlXades(rawXml, gymConfig);
    // 6. Send to Hacienda
    const token = await getHaciendaToken(gymConfig);
    const response = await sendToHacienda(signedXml, token, clave, gymConfig);
    // 7. Save to Firestore
    const invoiceRecord = {
        id: clave,
        userId,
        date: new Date().toISOString(),
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        consecutivo: nextConsecutivo,
        clave,
        status: response.status === 202 ? 'sent' : 'error',
        xmlUrl: '',
        response: response.data
    };
    await db.collection("invoices").doc(clave).set(invoiceRecord);
    await db.collection("users").doc(userId).update({
        invoices: admin.firestore.FieldValue.arrayUnion(invoiceRecord)
    });
    return { success: true, clave, status: invoiceRecord.status };
}
exports.generateAndSendInvoice = generateAndSendInvoice;
async function incrementConsecutivo() {
    const configRef = db.collection("gym_configs").doc("invoicing");
    const result = await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(configRef);
        const lastNum = (doc.exists ? doc.data()?.lastConsecutive : 0) || 0;
        const nextVal = lastNum + 1;
        transaction.update(configRef, { lastConsecutive: nextVal });
        return nextVal.toString().padStart(20, '0');
    });
    return result;
}
function generateClave(config, consecutivo) {
    const country = "506";
    const day = new Date().getDate().toString().padStart(2, '0');
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const year = new Date().getFullYear().toString().slice(-2);
    const idStr = config.id.replace(/-/g, '').padStart(12, '0');
    const situacion = "1"; // Normal
    const seguridad = Math.floor(10000000 + Math.random() * 90000000).toString(); // 8 digits
    return `${country}${day}${month}${year}${idStr}${consecutivo}${situacion}${seguridad}`;
}
function mapTaxTypeToHaciendaCode(type) {
    switch (type) {
        case 'fisica': return '01';
        case 'juridica': return '02';
        case 'dimex': return '03';
        case 'pasaporte': return '04';
        default: return '01';
    }
}
function buildXmlObject(emisor, receptor, data, consecutivo, clave) {
    return {
        FacturaElectronica: {
            $: {
                xmlns: "https://www.hacienda.go.cr/declaraciones-directas/v4.3/facturaElectronica",
                "xmlns:ds": "http://www.w3.org/2000/09/xmldsig#",
                "xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
                "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
            },
            Clave: clave,
            CodigoActividad: emisor.activityCode || "931101",
            NumeroConsecutivo: consecutivo,
            FechaEmision: new Date().toISOString(),
            Emisor: {
                Nombre: emisor.name,
                Identificacion: {
                    Tipo: mapTaxTypeToHaciendaCode(emisor.type),
                    Numero: emisor.id.replace(/-/g, '')
                },
                Ubicacion: {
                    Provincia: emisor.address?.province || "1",
                    Canton: emisor.address?.canton || "01",
                    Distrito: emisor.address?.district || "01",
                    Barrio: emisor.address?.neighborhood || "01",
                    OtrasSeñas: emisor.address?.other || "Kinetic Gym"
                },
                CorreoElectronico: emisor.email
            },
            Receptor: {
                Nombre: receptor.name,
                Identificacion: {
                    Tipo: mapTaxTypeToHaciendaCode(receptor.type),
                    Numero: receptor.id.replace(/-/g, '')
                },
                CorreoElectronico: receptor.email
            },
            CondicionVenta: "01",
            MedioPago: "04",
            DetalleServicio: {
                LineaDetalle: {
                    NumeroLinea: "1",
                    Codigo: "001",
                    Cantidad: "1",
                    UnidadMedida: "Sp",
                    Detalle: `Membresía Gimnasio - Plan ${data.planId}`,
                    PrecioUnitario: data.amount,
                    MontoTotal: data.amount,
                    SubTotal: data.amount,
                    MontoTotalLinea: data.amount
                }
            },
            ResumenFactura: {
                CodigoTipoMoneda: {
                    CodigoMoneda: data.currency,
                    TipoCambio: "1"
                },
                TotalServGravados: "0",
                TotalServExentos: data.amount,
                TotalMercanciasGravadas: "0",
                TotalMercanciasExentas: "0",
                TotalGravado: "0",
                TotalExento: data.amount,
                TotalVenta: data.amount,
                TotalDescuentos: "0",
                TotalVentaNeta: data.amount,
                TotalImpuesto: "0",
                TotalComprobante: data.amount
            }
        }
    };
}
// Logic for cryptographic signing (Simplified version of XAdES requirement)
async function signXmlXades(xml, config) {
    // This is where we would use node-forge or a specialized XAdES library
    // In a real production environment, you'd use the .p12 key here.
    console.log("Signing XML for id:", config.id);
    return xml; // TODO: Implement full XAdES-EPES signing
}
async function getHaciendaToken(config) {
    const url = !config.isStaging
        ? "https://idp.hacienda.go.cr/auth/realms/rut/protocol/openid-connect/token"
        : "https://idp.hacienda.go.cr/auth/realms/rut-stag/protocol/openid-connect/token";
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', config.isStaging ? 'api-pru' : 'api-prod');
    params.append('username', config.haciendaUser || '');
    params.append('password', config.haciendaPass || '');
    const response = await axios_1.default.post(url, params);
    return response.data.access_token;
}
async function sendToHacienda(xml, token, clave, config) {
    const url = !config.isStaging
        ? "https://api.comprobanteselectronicos.go.cr/recepcion/v1/recepcion"
        : "https://api-sandbox.comprobanteselectronicos.go.cr/recepcion/v1/recepcion";
    const body = {
        clave: clave,
        fecha: new Date().toISOString(),
        emisor: {
            tipoIdentificacion: mapTaxTypeToHaciendaCode(config.type),
            numeroIdentificacion: config.id.replace(/-/g, '')
        },
        receptor: null,
        comprobanteXml: Buffer.from(xml).toString('base64')
    };
    return axios_1.default.post(url, body, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
}
//# sourceMappingURL=invoicing.js.map