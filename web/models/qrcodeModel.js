import mongoose from "mongoose";

const productSchema = mongoose.Schema({
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

export const Product = mongoose.model('qrcodes', productSchema);

