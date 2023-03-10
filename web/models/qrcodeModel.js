import mongoose from "mongoose";

const qrcodeSchema = mongoose.Schema({
    shopDomain: { type: String },
    title: { type: String },
    productId: { type: String},
    varianId: { type: String},
    description: { type: String},
    handle: {type:String},
    discountId: { type: String },
    discountCode: { type: String },
    destination: {type:String},
    scans:{type:Number, default: 0},
}, { timestamps: true });

export const qrCode = mongoose.model('qrcodes', qrcodeSchema);

