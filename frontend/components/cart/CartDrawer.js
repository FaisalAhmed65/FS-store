/**
 * components/cart/CartDrawer.js
 * Slide-in cart panel.
 */
import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, mediaUrl } from "@/lib/utils";

export default function CartDrawer({ open, onClose }) {
  const { items, removeItem, updateQty, totalPrice, totalItems } = useCart();

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        </Transition.Child>

        {/* Panel */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-250" enterFrom="translate-x-full" enterTo="translate-x-0"
          leave="ease-in duration-200" leaveFrom="translate-x-0" leaveTo="translate-x-full"
        >
          <Dialog.Panel className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <Dialog.Title className="font-bold text-lg text-primary">
                My Cart {totalItems > 0 && <span className="text-muted font-normal text-sm">({totalItems})</span>}
              </Dialog.Title>
              <button onClick={onClose} aria-label="Close cart">
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {items.length === 0 ? (
                <div className="text-center text-muted py-16">
                  <p>Your cart is empty.</p>
                  <button onClick={onClose} className="mt-4 btn-accent rounded px-6 py-2">
                    Start Shopping
                  </button>
                </div>
              ) : (
                items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-3">
                    <div className="relative w-16 h-16 shrink-0 bg-gray-50 rounded overflow-hidden">
                      <Image
                        src={mediaUrl(product.image)}
                        alt={product.name}
                        fill
                        className="object-contain p-1"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                      <p className="text-sm text-price-red font-bold mt-0.5">{formatPrice(product.price)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => updateQty(product.id, quantity - 1)}
                          className="w-6 h-6 border rounded text-gray-600 hover:bg-gray-100 font-bold flex items-center justify-center"
                        >-</button>
                        <span className="text-sm w-5 text-center">{quantity}</span>
                        <button
                          onClick={() => updateQty(product.id, quantity + 1)}
                          className="w-6 h-6 border rounded text-gray-600 hover:bg-gray-100 font-bold flex items-center justify-center"
                        >+</button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="text-gray-400 hover:text-red-500 self-start mt-1"
                      aria-label="Remove"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-bold text-primary">{formatPrice(totalPrice)}</span>
                </div>
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="block w-full btn-accent text-center py-2 rounded font-semibold"
                >
                  View Cart & Checkout
                </Link>
              </div>
            )}
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}
