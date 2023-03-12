
import shopify from "../shopify.js";
import {
  getQrCodeOr404,
  getShopUrlFromSession,
  parseQrCodeBody,
  formatQrCodeResponse,
  increaseQrCode,
  goToProductView,
  generateQrcodeDestinationUrl,
} from "../helpers/qr-codes.js";
import { Product } from "../models/productModel.js";
import QRCode from "qrcode";



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

export const createQrCode = async (req, res) => {
  try {
    const shopDomain = await getShopUrlFromSession(req, res)
    const requestData = parseQrCodeBody(req);
    const product = new Product({
      ...requestData,
      shopDomain
    })
    await product.save();
    const response = await formatQrCodeResponse(req, res, [
      product.toJSON(),
    ]);
    res.status(200).send(response[0]);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

export const updateQrCode = async (req, res) => {
  const qrcode = await getQrCodeOr404(req, res);
  if (qrcode) {
    try {
      const product = await Product.findById(req.params.id);

      product.title = req.body.title || product.title;
      product.productId = req.body.productId || product.productId;
      product.handle = req.body.handle || product.handle;
      product.discountCode = req.body.discountCode || product.discountCode;
      product.discountId = req.body.discountId || product.discountId;
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
}

export const getAllQrCode = async (req, res) => {
  try {
    const shopDomain = await getShopUrlFromSession(req, res);
    const rawCodeData = await Product.find({
      shopDomain: shopDomain
    })
    const clone = JSON.parse(JSON.stringify(rawCodeData));
    const response = await formatQrCodeResponse(req, res, clone);
    res.status(200).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
}

export const getQrCodeById = async (req, res) => {
  const qrcode = await getQrCodeOr404(req, res);
  if (qrcode) {
    const formattedQrCode = await formatQrCodeResponse(req, res, [qrcode]);
    res.status(200).send(formattedQrCode[0]);
  }
}

export const deleteQrCode = async (req, res) => {
  const qrcode = await getQrCodeOr404(req, res);
  if (qrcode) {
    await Product.findByIdAndDelete(req.params.id)
    res.status(200).send();
  }
}

export const getDiscount = async (req, res) => {
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
}

export const scanQrCode = async (req, res) => {
  const qrcode = await getQrCodeOr404(req, res, false);
  if (qrcode) {
    const url = new URL(qrcode.shopDomain)
    await increaseQrCode(qrcode);
    return res.redirect(goToProductView(url, qrcode))
  }
};

export const generateImageQrCode = async (req, res) => {
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
}