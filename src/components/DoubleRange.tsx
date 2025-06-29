"use client"

import { postgres } from "@/lib/postgresClient";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const DoubleRange = ({title, measurement, column}:{title:string; measurement:string; column:string;}) => {

    const [open, setOpen] = useState(false);
    const [min, setMin] = useState(0);
    const [max, setMax] = useState(1);
    const [minValue, setMinValue] = useState(0);
    const [maxValue, setMaxValue] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [minText, setMinText] = useState("");
    const [maxText, setMaxText] = useState("");

    const searchParams = useSearchParams();
    const {replace} = useRouter();
    const params = new URLSearchParams(searchParams);

    useEffect(()=>{
        const getValues = async () => {
            setError(false);

            let productQuery = postgres.from("product").select(`${column}.max(), ${column}.min()`);

            if (params.has("cat")) { 
                const { data: productIds } = await postgres
                    .from("product_category")
                    .select("product_id")
                    .in("category_id", params.getAll("cat").map(id => Number(id)));

                productQuery = productQuery.in('id', productIds?.map(item => item.product_id)!);
            }

            if (params.has("search")) { productQuery = productQuery.textSearch('name', params.get("search")!, {type: "websearch"}); }
            if (params.has("brand")) { productQuery = productQuery.in("brand", params.getAll("brand").map(id => Number(id)) ); }
            if (params.has("stock")) { productQuery = productQuery.gt("quantity", 0); }
            if (params.has("sale")) { productQuery = productQuery.eq("on_sale", true); }

            await productQuery.then(({data: products})=>{
                try {
                    if (products) {
                        setMinValue(products[0]["min" as keyof typeof products[0]] as number);
                        setMaxValue(products[0]["max" as keyof typeof products[0]] as number);

                        if (params.has("min"+column)) {
                            setMin(Number(params.get("min"+column)));
                            setMinText(params.get("min"+column)!);
                        } else {
                            setMin(products[0]["min" as keyof typeof products[0]] as number);
                            setMinText(products[0]["min" as keyof typeof products[0]].toString());
                        }

                        if (params.has("max"+column)) {
                            setMax(Number(params.get("max"+column)));
                            setMaxText(params.get("max"+column)!);
                        } else {
                            setMax(products[0]["max" as keyof typeof products[0]] as number);
                            setMaxText(products[0]["max" as keyof typeof products[0]].toString());
                        }
                    } else {
                        setError(true);
                    }
                } catch (error) {
                    setError(true);
                }
                setLoading(false);
            });
        }
        getValues();
    },[searchParams]);

    const handleSlide = (e:React.ChangeEvent<HTMLInputElement>) => {
        const {name,valueAsNumber} = e.target;
        if (name === "min") { 
            if (valueAsNumber > max) { 
                setMin(max);
                setMinText(max.toString());
            } else { 
                setMin(valueAsNumber);
                setMinText(valueAsNumber.toString());
            }
        } else { 
            if (valueAsNumber < min) { 
                setMax(min);
                setMaxText(min.toString());
            } else { 
                setMax(valueAsNumber);
                setMaxText(valueAsNumber.toString());
            }
        }
    }

    const handleRange = (e:React.PointerEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
        const {name,value} = e.currentTarget;
        if (name === "min") {
            if (value !== minValue.toString() && value !== "") { 
                params.set(name+column, value); 
                setMin(Number(value));
            } else { 
                params.delete(name+column); 
                setMin(minValue);
            }
        } else {
            if (value !== maxValue.toString() && value !== "") { 
                params.set(name+column, value); 
                setMax(Number(value));
            } else { 
                params.delete(name+column); 
                setMax(maxValue);
            }
        }
        params.delete("page");
        replace(`shop?${params}`);
    }

    const handleTextEnter = (e:React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            const {name,value} = e.currentTarget;
            if (name === "min") {
                if (value !== minValue.toString() && value !== "") { 
                    params.set(name+column, value); 
                    setMin(Number(value) || minValue);
                } else { 
                    params.delete(name+column); 
                    setMin(minValue);
                    setMinText(minValue.toString());
                }
            } else {
                if (value !== maxValue.toString() && value !== "") { 
                    params.set(name+column, value); 
                    setMax(Number(value) || maxValue);
                } else { 
                    params.delete(name+column);
                    setMax(maxValue);
                    setMaxText(maxValue.toString());
                }
            }
            params.delete("page");
            replace(`shop?${params}`);
        }
    }

    if (loading) { return(null); }
    if (error) { return(null); }

    return (
        <div className="flex flex-col gap-3 bg-gray-100 rounded-2xl py-2 px-2 h-max cursor-pointer items-center" onClick={()=>setOpen(!open)}>
            {open ? (
                <p className="text-sm font-medium px-2 w-max relative">
                    {title}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-5 absolute top-0 -right-4">
                        <path d="M3.75 7.25a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Z" />
                    </svg>
                </p>
            ) : (
                <div className="flex">
                    <p className="text-sm font-medium px-2 w-max relative">{title}</p>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-5">
                        <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                    </svg>
                </div>
            )}
            {open && (
                <div className="flex flex-col gap-4 cursor-default" onClick={(e)=>e.stopPropagation()}>
                    <div className="w-full bg-white h-1.5 relative rounded-full">
                        <input type="range" name="min" min={minValue} max={maxValue} value={min} step={0.01} onChange={handleSlide} onPointerUp={handleRange} onTouchEnd={handleRange} 
                            className="absolute w-full pr-[22px] top-1/2 transform -translate-y-1/2 pointer-events-none appearance-none bg-transparent 
                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full 
                                [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:ring-1
                                [&::-webkit-slider-thumb]:ring-gray-400 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:ring-1 [&::-moz-range-thumb]:ring-gray-400 
                                [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white 
                                [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:cursor-pointer
                            " 
                        />
                        <input type="range" name="max" min={minValue} max={maxValue} value={max} step={0.01} onChange={handleSlide} onPointerUp={handleRange} onTouchEnd={handleRange} 
                            className="absolute w-full pl-[22px] top-1/2 transform -translate-y-1/2 pointer-events-none appearance-none bg-transparent
                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full 
                                [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:ring-1
                                [&::-webkit-slider-thumb]:ring-gray-400 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:ring-1 [&::-moz-range-thumb]:ring-gray-400 
                                [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white 
                                [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:cursor-pointer
                            " 
                        />
                    </div>
                    <div className="flex justify-between gap-2">
                        <div className="flex w-20">
                            <div className="bg-gray-100 rounded-l-full py-1 px-2 text-xs font-medium ring-1 ring-gray-400 min-w-6">{measurement}</div>
                            <input type="text" placeholder="min" name="min" value={minText} className="w-full rounded-r-full outline-none text-xs px-1 ring-1 ring-gray-400" 
                                onChange={(e)=>setMinText(e.target.value)} onKeyDown={handleTextEnter}
                            />
                        </div>
                        <div className="flex w-20">
                            <div className="bg-gray-100 rounded-l-full py-1 px-2 text-xs font-medium ring-1 ring-gray-400 min-w-6">{measurement}</div>
                            <input type="text" placeholder="max" name="max" value={maxText} className="w-full rounded-r-full outline-none text-xs px-1 ring-1 ring-gray-400" 
                                onChange={(e)=>setMaxText(e.target.value)} onKeyDown={handleTextEnter}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DoubleRange