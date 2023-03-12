/*
  Merchants need to be able to scan the QR Codes.
  This file provides the publicly available URLs to do that.
*/
import QRCode from "qrcode";

import shopify from "../shopify.js";
import { getQrCodeOr404, generateQrcodeDestinationUrl, goToProductView, increaseQrCode } from "../helpers/qr-codes.js";


export default function applyQrCodePublicEndpoints(app) {
  /*
    The URL for a QR code image.
    The image is generated dynamically so that merchants can change the configuration for a QR code.
    This way changes to the QR code won't break the redirection.
  */
  app.get("/qrcodes/:id/image", async (req, res) => {
    const qrcode = await getQrCodeOr404(req, res, false);
    if (qrcode) {
      const destinationUrl = generateQrcodeDestinationUrl(qrcode);
      res
        .status(200)
        .set("Content-Type", "image/png")
        .set(
          "Content-Disposition",
          `inline; filename="qr_code_${qrcode._id}.png"`
        )
        .send(await QRCode.toBuffer(destinationUrl));
    }
  });

  /* The URL customers are taken to when they scan the QR code */
  app.get("/qrcodes/:id/scan", async (req, res) => {
    const qrcode = await getQrCodeOr404(req, res, false);
    if (qrcode) {
      const url = new URL(qrcode.shopDomain)
      await increaseQrCode(qrcode);
      res.redirect(await goToProductView(url, qrcode))
    }
  });
}
