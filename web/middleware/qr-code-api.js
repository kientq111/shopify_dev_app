/*
  The custom REST API to support the app frontend.
  Handlers combine application data from qr-codes-db.js with helpers to merge the Shopify GraphQL Admin API data.
  The Shop is the Shop that the current user belongs to. For example, the shop that is using the app.
  This information is retrieved from the Authorization header, which is decoded from the request.
  The authorization header is added by App Bridge in the frontend code.
*/

import express from "express";

import shopify from "../shopify.js";
import {
  getQrCodeOr404,
  getShopUrlFromSession,
  parseQrCodeBody,
  formatQrCodeResponse,
} from "../helpers/qr-codes.js";
import { qrCode } from "../models/qrcodeModel.js";

const DISCOUNTS_QUERY = `
  query discounts($first: Int!) {
    codeDiscountNodes(first: $first) {
      edges {
        node {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
            }
            ... on DiscountCodeBxgy {
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
            }
            ... on DiscountCodeFreeShipping {
              codes(first: 1) {
                edges {
                  node {
                    code
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export default function applyQrCodeApiEndpoints(app) {
  app.use(express.json());
  app.get("/api/discounts", async (req, res) => {
    const client = new shopify.api.clients.Graphql({
      session: res.locals.shopify.session,
    });
    /* Fetch all available discounts to list in the QR code form */
    const discounts = await client.query({
      data: {
        query: DISCOUNTS_QUERY,
        variables: {
          first: 25,
        },
      },
    });

    res.send(discounts.body.data);
  });

  //Done
  app.post("/api/qrcodes", async (req, res) => {
    try {
      const shopDomain = await getShopUrlFromSession(req, res)
      const requestData = parseQrCodeBody(req);
      const qrcode = new qrCode({
        ...requestData,
        shopDomain
      })
      await qrcode.save();
      const response = await formatQrCodeResponse(req, res, [
        qrcode.toJSON(),
      ]);
      res.status(200).send(response[0]);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/qrcodes/:id", async (req, res) => {
    const qrcode = await getQrCodeOr404(req, res);

    if (qrcode) {
      try {
        const product = await qrCode.findById(req.params.id);

        product.title = req.body.title || product.title;
        product.productId = req.body.productId || product.productId;
        product.handle = req.body.handle || product.handle;
        product.discountCode = req.body.discountCode || product.discountCode;
        product.destination = req.body.destination || product.destination;
        await product.save();
        const response = await formatQrCodeResponse(req, res, [
          product.toJSON(),
        ]);
        res.status(200).send(response[0]);
      } catch (error) {
        res.status(500).send(error.message);
      }
    }
  });

  app.get("/api/qrcodes/:id", async (req, res) => {
    const qrcode = await getQrCodeOr404(req, res);
    if (qrcode) {
      const formattedQrCode = await formatQrCodeResponse(req, res, [qrcode]);
      res.status(200).send(formattedQrCode[0]);
    }
  });

  app.delete("/api/qrcodes/:id", async (req, res) => {
    const qrcode = await getQrCodeOr404(req, res);
    if (qrcode) {
      await qrCode.findByIdAndDelete(req.params.id)
      res.status(200).send();
    }
  });

  // 1.
  // @desc: list all QR code product have created
  // @route: GET /api/qrcodes
  // @access: Public - return list qr product 
  app.get("/api/qrcodes", async (req, res) => {
    try {
      const shopDomain = await getShopUrlFromSession(req, res);
      const rawCodeData = await qrCode.find({
        shopDomain: shopDomain
      })
      const clone = JSON.parse(JSON.stringify(rawCodeData));
      const response = await formatQrCodeResponse(req, res, clone);
      res.status(200).send(response);
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message);
    }
  });
}
