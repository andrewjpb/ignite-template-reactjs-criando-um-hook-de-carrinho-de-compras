import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productExists = updatedCart.find(
        (product) => product.id === productId
      );

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;

      const currentAmount = productExists ? productExists.amount : 0;

      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error("Qauntidade solicitada fora de estoque");
        return;
      }

      if (productExists) {
        productExists.amount = amount;
      } else {
        const { data } = await api.get(`/products/${productId}`);

        const newProduct = {
          ...data,
          amount: 1,
        };

        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productExists = updatedCart.findIndex(
        (product) => product.id === productId
      );
      if (productExists < 0) {
        toast.error("Erro na remoção do produto");
        return;
      }
      setCart(updatedCart.filter((product) => product.id !== productId));
      localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify(
          updatedCart.filter((product) => product.id !== productId)
        )
      );
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        throw Error();
      }

      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;
      if (amount > stockAmount) {
        toast.error("Qauntidade solicitada fora de estoque");
        return;
      }

      const cartUpdate = [...cart];
      const productUpdate = cartUpdate.find(
        (product) => product.id === productId
      );

      if (productUpdate) {
        productUpdate.amount = amount;
        setCart(cartUpdate);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartUpdate));
      } else {
        throw Error();
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
      return;
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
