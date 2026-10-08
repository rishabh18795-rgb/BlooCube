import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 sm:px-6 py-12">
      <div className="max-w-7xl mx-auto text-slate-600 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 sm:gap-10">
        <div className="col-span-2 sm:col-span-3 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Image src="/logo.png" alt="BlooCube" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-[#111827]">BlooCube</span>
          </div>
          <p className="text-[#667085] text-sm max-w-[22ch]">
            The influencer marketing marketplace where brands post, creators apply, and deals happen.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-[#111827] text-sm">For Brands</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/find-creators" className="hover:text-brand-indigo transition-colors">Find Creators</Link></li>
            <li><Link href="/campaigns" className="hover:text-brand-indigo transition-colors">Marketplace</Link></li>
            <li><Link href="/signup?role=brand" className="hover:text-brand-indigo transition-colors">Join as a Brand</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-[#111827] text-sm">For Creators</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/how-it-works" className="hover:text-brand-indigo transition-colors">How It Works</Link></li>
            <li><Link href="/pricing" className="hover:text-brand-indigo transition-colors">Pricing</Link></li>
            <li><Link href="/signup?role=creator" className="hover:text-brand-indigo transition-colors">Join as a Creator</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-[#111827] text-sm">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-brand-indigo transition-colors">About</Link></li>
            <li><Link href="/resources" className="hover:text-brand-indigo transition-colors">Resources</Link></li>
            <li><Link href="/contact" className="hover:text-brand-indigo transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-[#111827] text-sm">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/privacy" className="hover:text-brand-indigo transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-brand-indigo transition-colors">Terms of Service</Link></li>
            <li><Link href="/cancellation-refund" className="hover:text-brand-indigo transition-colors">Cancellation & Refund</Link></li>
            <li><Link href="/shipping-delivery" className="hover:text-brand-indigo transition-colors">Shipping & Delivery</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-slate-100 text-center text-[#98A2B3] text-sm">
        <p>&copy; {new Date().getFullYear()} BlooCube. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
