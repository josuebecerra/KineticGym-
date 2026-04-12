import * as admin from "firebase-admin";
import axios from "axios";
import * as forge from "node-forge";
import * as xml2js from "xml2js";
import { GymTaxConfig, TaxData } from "../../src/types";

const db = admin.firestore();

/**
 * Handles the end-to-end flow of generating, signing, and sending an invoice.
 */
export async function generateAndSendInvoice(userId: string, invoiceData: any) {
  // 1. Get Gym Configuration (EMISOR)
  const gymConfigDoc = await db.collection("config").doc("gymTaxConfig").get();
  if (!gymConfigDoc.exists) {
    throw new Error("La configuración fiscal del gimnasio no ha sido establecida.");
  }
  const gymConfig = gymConfigDoc.data() as GymTaxConfig;

  // 2. Get User Data (RECEPTOR)
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new Error("Usuario no encontrado.");
  }
  const userData = userDoc.data();
  const receptorTaxData = userData?.taxData as TaxData;

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
  if (gymConfig.mode === 'production' || gymConfig.mode === 'staging') {
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
      xmlUrl: '', // Upload to Storage later
      response: response.data
    };

    await db.collection("invoices").doc(clave).set(invoiceRecord);
    await db.collection("users").doc(userId).update({
      invoices: admin.firestore.FieldValue.arrayUnion(invoiceRecord)
    });

    return { success: true, clave, status: invoiceRecord.status };
  } else {
    // Development mode logic (Simulated)
    return { success: true, clave, status: 'simulated' };
  }
}

async function incrementConsecutivo(): Promise<string> {
  const counterRef = db.collection("config").doc("invoiceCounter");
  const result = await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    const newVal = (doc.exists ? doc.data()?.current : 0) + 1;
    transaction.set(counterRef, { current: newVal });
    return newVal.toString().padStart(20, '0');
  });
  return result;
}

function generateClave(config: GymTaxConfig, consecutivo: string): string {
  const country = "506";
  const day = new Date().getDate().toString().padStart(2, '0');
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const year = new Date().getFullYear().toString().slice(-2);
  const idStr = config.issuerId.padStart(12, '0');
  const situacion = "1"; // Normal
  const seguridad = Math.floor(10000000 + Math.random() * 90000000).toString(); // 8 digits
  
  return `${country}${day}${month}${year}${idStr}${consecutivo}${situacion}${seguridad}`;
}

function buildXmlObject(emisor: GymTaxConfig, receptor: TaxData, data: any, consecutivo: string, clave: string) {
  return {
    FacturaElectronica: {
      $: {
        xmlns: "https://www.hacienda.go.cr/declaraciones-directas/v4.3/facturaElectronica",
        "xmlns:ds": "http://www.w3.org/2000/09/xmldsig#",
        "xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
      },
      Clave: clave,
      CodigoActividad: emisor.activityCode,
      NumeroConsecutivo: consecutivo,
      FechaEmision: new Date().toISOString(),
      Emisor: {
        Nombre: emisor.issuerName,
        Identificacion: {
          Tipo: emisor.idType === 'physical' ? '01' : '02',
          Numero: emisor.issuerId
        },
        Ubicacion: {
          Provincia: "1",
          Canton: "01",
          Distrito: "01",
          Barrio: "01",
          OtrasSeñas: "Kinetic Gym HQ"
        },
        CorreoElectronico: emisor.supportEmail
      },
      Receptor: {
        Nombre: receptor.name,
        Identificacion: {
          Tipo: receptor.idType === 'physical' ? '01' : '02',
          Numero: receptor.idNumber
        },
        CorreoElectronico: receptor.email
      },
      CondicionVenta: "01", // Contado
      MedioPago: "04", // Tarjeta
      DetalleServicio: {
        LineaDetalle: {
          NumeroLinea: "1",
          Codigo: "001",
          Cantidad: "1",
          UnidadMedida: "Sp", // Servicio profesional / otros
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
async function signXmlXades(xml: string, config: GymTaxConfig): Promise<string> {
  // This is where we would use node-forge or a specialized XAdES library
  // In a real production environment, you'd use the .p12 key here.
  console.log("Signing XML for clave:", config.issuerId);
  return xml; // TODO: Implement full XAdES-EPES signing
}

async function getHaciendaToken(config: GymTaxConfig) {
  const url = config.mode === 'production' 
    ? "https://idp.hacienda.go.cr/auth/realms/rut/protocol/openid-connect/token"
    : "https://idp.hacienda.go.cr/auth/realms/rut-stag/protocol/openid-connect/token";

  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', 'api-pru'); // For staging
  params.append('username', config.apiUsername);
  params.append('password', config.apiPassword);

  const response = await axios.post(url, params);
  return response.data.access_token;
}

async function sendToHacienda(xml: string, token: string, clave: string, config: GymTaxConfig) {
  const url = config.mode === 'production'
    ? "https://api.comprobanteselectronicos.go.cr/recepcion/v1/recepcion"
    : "https://api-sandbox.comprobanteselectronicos.go.cr/recepcion/v1/recepcion";

  const body = {
    clave: clave,
    fecha: new Date().toISOString(),
    emisor: {
      tipoIdentificacion: config.idType === 'physical' ? '01' : '02',
      numeroIdentificacion: config.issuerId
    },
    receptor: null, // Depending on the payload
    comprobanteXml: Buffer.from(xml).toString('base64')
  };

  return axios.post(url, body, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}
