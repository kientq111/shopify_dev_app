/*
  Merchants need to be able to scan the QR Codes.
  This file provides the publicly available URLs to do that.
*/

import { generateImageQrCode, scanQrCode } from "../controller/QRCodeController.js";


export default function applyQrCodePublicEndpoints(app) {

  // 1.
  // @desc: Scan a QR code
  // @route: GET /qrcode/:id/scan
  app.get("/qrcodes/:id/scan", scanQrCode)

  // 2.
  // @desc: Generate url QR code image
  // @route: GET /qrcode/:id/image
  app.get("/qrcodes/:id/image", generateImageQrCode);


}