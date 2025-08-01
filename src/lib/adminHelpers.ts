"use server";

import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types";

const postgres = createClient<Database> (
  process.env.NEXT_PUBLIC_POSTGRES_URL!,
  process.env.POSTGRES_SECRET!,
);

export async function AddProductToDB(
    name:string, 
    price:number, 
    stock:number, 
    sku:string, 
    sale:boolean, 
    mpn?:string, 
    brand?:number, 
    ogprice?:number, 
    specs?:{[k:string]: { key:string, value:string } }, 
    vars?:{ [k:number]: { [type:string]: { [key:string]: number | undefined | null } } }, 
    cats?:{ [k:number]: number },
    images?:{ [k:number]: File },
) {
    let err = false;
    let id = 0;

    const {data, error } = await postgres.from('product').select('id').order('id', { ascending: false }).limit(1).single();
    if (error) { err = true; } 
    else if (data) { id = data.id + 1; } 
    else { err = true; }

    if (price < 0.01) { err = true; }
    if (!Number.isInteger(stock)) { err = true; }
    if (ogprice && ogprice < 0.01) { err = true;}
    if (!ogprice || !sale) { ogprice = price; }

    let specifications: {key:string, value:string}[];
    let finalSpecs: {[key:string]: string} | undefined = undefined;

    if (specs && Object.keys(specs).length > 0 && !err) { 
        try {
            specifications = Object.values(specs);
            finalSpecs = {};
            specifications.forEach(s => {
                finalSpecs![s.key as keyof typeof finalSpecs] = s.value;
            });
        } catch (e) {
            err = true;
        }
    }

    let variants: { [type:string]: { [key:string]: number | undefined | null } }[];
    let finalVars: { [type:string]: { [key:string]: number | undefined | null } } | undefined = undefined;

    if (vars && Object.keys(vars).length > 0 && !err) {
        try {
            variants = Object.values(vars);
            finalVars = {};
            variants.forEach(v=>{
                for (const type in v) {
                    finalVars![type] = v[type];
                }
            });
        } catch (e) {
            err = true;
        }
    }

    let categories: number[] | undefined = undefined;
    
    if (!err && cats && Object.keys(cats).length > 0) {
        try {
            categories = [...new Set(Object.values(cats))];
        } catch (e) {
            err = true;
        }
    }

    if (!err) {
        const { data, error } = await postgres.from('product').select('sku').eq("sku", sku);
        if (error) { err = true; } 
        else if (data) { if (data.length > 0) { err = true; } } 
        else { err = true; }
    }

    if (!err && mpn) {
        const { data, error } = await postgres.from('product').select('manufacturer_code').eq("manufacturer_code", mpn);
        if (error) { err = true; } 
        else if (data) { if (data.length > 0) { err = true; } } 
        else { err = true; }
    }

    if (!err) {
        let newProduct: {
            id:number, 
            name:string, 
            price:number, 
            quantity:number, 
            sku:string, 
            original_price:number, 
            on_sale:boolean, 
            manufacturer_code?:string, 
            brand?:number, 
            specifications?:{}, 
            variants?:{},
            image_urls?:string[],
        } = { 
            id: id, 
            name: name, 
            quantity: stock, 
            price: price, 
            sku: sku, 
            original_price: ogprice, 
            on_sale: sale, 
        }

        if (mpn) { newProduct["manufacturer_code"] = mpn; }
        if (brand) { newProduct["brand"] = brand; }
        if (finalSpecs) { newProduct["specifications"] = finalSpecs; }
        if (finalVars) { newProduct["variants"] = finalVars; }

        if (images && Object.keys(images).length > 0) { 
            const imageList = Object.values(images);
            let imageUrls = [] as string[];

            for (let i = 0; i < imageList.length; i++) {
                if (err) { break; }

                const { error } = await postgres.storage.from("product-images").upload("/productImages/" + id.toString() + "/" + (i+1).toString() + "." + imageList[i].name.split(".").at(-1), imageList[i]);
                if (error) { err = true; }
                else { imageUrls.push("/productImages/" + id.toString() + "/" + (i+1).toString() + "." + imageList[i].name.split(".").at(-1)); }
            }

            if (!err) {
                newProduct["image_urls"] = imageUrls;
            }
        }

        if (!err) {
            const { error } = await postgres.from("product").insert(newProduct);
            if (error) { err = true; }
        }
        
        if (categories && !err) {
            categories.forEach(async c=>{
                const { error } = await postgres.from("product_category").insert({ "product_id": id, "category_id": c });
                if (error) { err = true; }
            })
        }

        if (!err) return false;
    }

    return true;
}