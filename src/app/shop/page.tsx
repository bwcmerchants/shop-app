import Filter from "@/components/Filter"
import ProductList from "@/components/ProductList"
import SearchBar from "@/components/SearchBar"
import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"

const ShopPage = async ({searchParams}:{searchParams:any}) => {

    const params = await searchParams;

    return (
        <div className='px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 relative h-max min-h-[calc(100vh-80px)] xl:min-h-[calc(100vh-144px)]'>
            {/* CAMPAIGN */}
            {/* <div className="hidden bg-blue-50 px-4 sm:flex justify-between h-64">
                <div className="w-2/3 flex flex-col items-center justify-center gap-8">
                    <h1 className="text-4xl font-medium leading-[48px] text-gray-700">Grab up to 30% off on<br/> Selected Products</h1>
                    <Link href="/list?sale=true">
                        <button className="rounded-3xl bg-blue-700 text-white w-max py-3 px-5 text-sm">Buy Now</button>
                    </Link>
                </div>
                <div className="relative w-1/3">
                    <Image src="/woman.png" alt="" fill className="object-contain"/>
                </div>
            </div> */}
            {/* TITLE */}
            <h1 className="font-medium text-2xl xl:pt-8">Shop</h1>
            <div className="md:hidden mt-6">
                <Suspense fallback="Loading...">
                    <SearchBar />
                </Suspense>
            </div>
            {/* FILTER */}
            <Suspense fallback="Loading...">
                <Filter />
            </Suspense>
            {/* PRODUCTS */}
            <Suspense fallback={"Loading..."}>
                <ProductList searchParams={params} limit={20} />
            </Suspense>
        </div>
    )
}

export default ShopPage