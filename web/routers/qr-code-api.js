/*
  The custom REST API to support the app frontend.
  Handlers combine application data from qr-codes-db.js with helpers to merge the Shopify GraphQL Admin API data.
  The Shop is the Shop that the current user belongs to. For example, the shop that is using the app.
  This information is retrieved from the Authorization header, which is decoded from the request.
  The authorization header is added by App Bridge in the frontend code.
*/

import express from "express";
import { getAllQrCode, getQrCodeById, getDiscount, createQrCode, updateQrCode, deleteQrCode } from "../controller/QRCodeController.js";

export default function applyQrCodeApiEndpoints(app) {
  app.use(express.json());

  // 1.
  // @desc: list all QR code product have created
  // @route: GET /api/qrcodes
  app.get("/api/qrcodes", getAllQrCode);


  // 2.
  // @desc: create new QR code
  // @route: POST /api/qrcodes
  app.post("/api/qrcodes", createQrCode);

  // 3.
  // @desc: update QR code
  // @route: PATCH /api/qrcodes
  app.patch("/api/qrcodes/:id", updateQrCode);

  // 4.
  // @desc: Get a QR code
  // @route: GET /api/qrcode/:id
  app.get("/api/qrcodes/:id", getQrCodeById);

  // 5.
  // @desc: Delete a QR code
  // @route: DELETE /api/qrcode/:id
  app.delete("/api/qrcodes/:id", deleteQrCode);

  // 6.
  // @desc: Get Discounts
  // @route: GET /api/discounts
  app.get("/api/discounts", getDiscount);

}
