import { Product } from "../models/qrcodeModel.js";
import shopify from "../shopify.js";

/*
  The app's database stores the productId and the discountId.
  This query is used to get the fields the frontend needs for those IDs.
  By querying the Shopify GraphQL Admin API at runtime, data can't become stale.
  This data is also queried so that the full state can be saved to the database, in order to generate QR code links.
*/
const DEFAULT_PURCHASE_QUANTITY = 1;

const QR_CODE_ADMIN_QUERY = `
  query nodes($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        handle
        title
        images(first: 1) {
          edges {
            node {
              url
            }
          }
        }
      }
      ... on ProductVariant {
        id
      }
      ... on DiscountCodeNode {
        id
      }
    }
  }
`;
//need fixing
export async function getQrCodeOr404(req, res, checkDomain = true) {
  try {
    const response = await Product.findById(req.params.id)
    if (
      response === undefined ||
      (checkDomain &&
        (await getShopUrlFromSession(req, res)) !== response.shopDomain)
    ) {
      res.status(404).send();
    } else {
      return response.toJSON();
    }
  } catch (error) {
    res.status(500).send(error.message);
  }


  return undefined;
}


/*
Expect body to contain
title: string
productId: string
variantId: string
handle: string
discountId: string
discountCode: string
destination: string
*/
export function parseQrCodeBody(req, res) {
  return {
    title: req.body.title,
    productId: req.body.productId,
    variantId: req.body.variantId,
    handle: req.body.handle,
    discountId: req.body.discountId,
    discountCode: req.body.discountCode,
    destination: req.body.destination,
  };
}

/*
  Replaces the productId with product data queried from the Shopify GraphQL Admin API
*/
export async function formatQrCodeResponse(req, res, rawCodeData) {
  const ids = [];

  /* Get every product, variant and discountID that was queried from the database */
  rawCodeData.forEach(({ productId, discountId, variantId }) => {
    ids.push(productId);
    ids.push(variantId);

    if (discountId) {
      ids.push(discountId);
    }
  });

  /* Instantiate a new GraphQL client to query the Shopify GraphQL Admin API */
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  /* Query the Shopify GraphQL Admin API */
  const adminData = await client.query({
    data: {
      query: QR_CODE_ADMIN_QUERY,
      /* The IDs that are pulled from the app's database are used to query product, variant and discount information */
      variables: { ids },
    },
  });

  //compare product server with product admin
  const formattedData = rawCodeData.map((qrCode) => {
    let product = adminData.body.data.nodes.find(
      (node) => qrCode.productId === node?.id
    ) || {
      title: "Deleted product",
    };

    const discountDeleted =
      qrCode.discountId &&
      !adminData.body.data.nodes.find((node) => qrCode.discountId === node?.id);

    const formattedQRCode = {
      ...qrCode,
      product,
      discountCode: discountDeleted ? "" : qrCode.discountCode,
    };

    /* Since product.id already exists, productId isn't required */
    delete formattedQRCode.productId;

    return formattedQRCode;
  });

  return formattedData;
}

export const generateQrcodeDestinationUrl = function (qrcode) {
  return `${shopify.api.config.hostScheme}://${shopify.api.config.hostName}/qrcodes/${qrcode._id}/scan`;
}

export const generateQrcodeImageUrl = function (qrcode) {
  return `${shopify.api.config.hostScheme}://${shopify.api.config.hostName}/qrcodes/${qrcode._id}/image`;
}

export const increaseQrCode = async (qrcode) => {
  const product = await Product.findById(qrcode._id);
  product.scans = product.scans + 1
  await product.save()
}

export async function getShopUrlFromSession(req, res) {
  return `https://${res.locals.shopify.session.shop}`;
}

export function goToProductView(url, qrcode) {
  return productViewURL({
    discountCode: qrcode.discountCode,
    host: url.toString(),
    productHandle: qrcode.handle,
  });
}

/* Generate the URL to a product page */
function productViewURL({ host, productHandle, discountCode }) {
  const url = new URL(host);
  const productPath = `/products/${productHandle}`;

  if (discountCode) {
    url.pathname = `/discount/${discountCode}`;
    url.searchParams.append("redirect", productPath);
  } else {
    url.pathname = productPath;
  }

  return url.toString();
}

