"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { cartService } from "@/services/cartService";

type CartContextType = {
  cartItems: { [key: string]: number };
  totalItems: number;
  addToCart: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  updateCartCount: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<{ [key: string]: number }>({});
  const [totalItems, setTotalItems] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  // Загружаем корзину при первом рендере и при изменении reloadKey
  useEffect(() => {
    // Для лучшей отзывчивости, предварительно устанавливаем кэшированные данные
    updateCartCount();
    
    // Затем загружаем полные данные асинхронно
    const loadFullCartData = async () => {
      try {
        if (cartService && typeof cartService.loadUserCart === 'function') {
          const userCart = await cartService.loadUserCart();
          setCartItems(userCart);
          
          // Пересчитываем общее количество товаров
          const total = Object.values(userCart).reduce((sum: number, count) => sum + (count as number), 0);
          setTotalItems(total);
        }
      } catch (error) {
        console.error('Ошибка загрузки полных данных корзины:', error);
      }
    };
    
    loadFullCartData();
  }, [reloadKey]);

  // Обработчик видимости страницы для обновления данных при возвращении на вкладку
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Сбрасываем кэш при возвращении на страницу
        cartService.clearCache();
        // Обновляем данные
        setReloadKey(prev => prev + 1);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Также обновляем данные при загрузке страницы
    window.addEventListener('load', () => {
      cartService.clearCache();
      setReloadKey(prev => prev + 1);
    });
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('load', () => {
        cartService.clearCache();
        setReloadKey(prev => prev + 1);
      });
    };
  }, []);

  const updateCartCount = () => {
    try {
      // Добавляем проверку на существование cartService
      if (!cartService || typeof cartService.getCart !== 'function') {
        console.error('cartService или метод getCart не определены');
        return;
      }
      
      // Сначала сбрасываем кэш для получения свежих данных
      cartService.clearCache();
      
      // Теперь получаем данные
      const cart = cartService.getCart();
      setCartItems(cart);
      
      // Подсчитываем общее количество товаров в корзине
      const total = Object.values(cart).reduce((sum: number, count) => sum + (count as number), 0);
      setTotalItems(total);
    } catch (error) {
      console.error('Ошибка при обновлении количества товаров в корзине:', error);
      setCartItems({});
      setTotalItems(0);
    }
  };

  const addToCart = (productId: string, quantity: number) => {
    try {
      // Проверяем существование cartService и метода addToCart
      if (!cartService || typeof cartService.addToCart !== 'function') {
        console.error('cartService или метод addToCart не определены');
        return;
      }
      
      // Мгновенно обновляем UI для лучшего UX
      const newCartItems = { ...cartItems };
      
      if (quantity < 0 && newCartItems[productId]) {
        // Если уменьшаем количество, проверяем, не станет ли оно отрицательным
        const newValue = Math.max(0, (newCartItems[productId] || 0) + quantity);
        if (newValue === 0) {
          delete newCartItems[productId];
        } else {
          newCartItems[productId] = newValue;
        }
      } else {
        // Добавляем товар или увеличиваем количество
        newCartItems[productId] = (newCartItems[productId] || 0) + quantity;
      }
      
      setCartItems(newCartItems);
      
      // Пересчитываем общее количество товаров сразу
      const newTotalItems = Object.values(newCartItems).reduce((sum: number, count) => sum + (count as number), 0);
      setTotalItems(newTotalItems);
      
      // Асинхронно обновляем данные в хранилище
      if (quantity < 0 && quantity > -10) { // Предполагаем, что если quantity < -10, это операция полного удаления
        // Для уменьшения используем decreaseItem
        cartService.decreaseItem(productId).catch(error => {
          console.error('Ошибка при уменьшении количества товара в корзине:', error);
          updateCartCount(); // В случае ошибки восстанавливаем предыдущее состояние
        });
      } else if (quantity < 0) {
        // Полное удаление
        cartService.removeFromCart(productId).catch(error => {
          console.error('Ошибка при удалении товара из корзины:', error);
          updateCartCount(); // В случае ошибки восстанавливаем предыдущее состояние
        });
      } else {
        // Добавление
        cartService.addToCart(productId, quantity).catch(error => {
          console.error('Ошибка при сохранении товара в корзину:', error);
          updateCartCount(); // В случае ошибки восстанавливаем предыдущее состояние
        });
      }
    } catch (error) {
      console.error('Ошибка при добавлении товара в корзину:', error);
      updateCartCount(); // В случае ошибки восстанавливаем предыдущее состояние
    }
  };

  const removeFromCart = (productId: string) => {
    try {
      // Проверяем существование cartService и метода removeFromCart
      if (!cartService || typeof cartService.removeFromCart !== 'function') {
        console.error('cartService или метод removeFromCart не определены');
        return;
      }
      
      // Мгновенно обновляем UI для лучшего UX
      const newCartItems = { ...cartItems };
      delete newCartItems[productId];
      setCartItems(newCartItems);
      
      // Пересчитываем общее количество товаров сразу
      const newTotalItems = Object.values(newCartItems).reduce((sum: number, count) => sum + (count as number), 0);
      setTotalItems(newTotalItems);
      
      // Асинхронно обновляем данные в хранилище
      cartService.removeFromCart(productId).catch(error => {
        console.error('Ошибка при удалении товара из корзины:', error);
        // В случае ошибки восстанавливаем предыдущее состояние
        updateCartCount();
      });
    } catch (error) {
      console.error('Ошибка при удалении товара из корзины:', error);
    }
  };

  const clearCart = () => {
    try {
      // Проверяем существование cartService и метода clearCart
      if (!cartService || typeof cartService.clearCart !== 'function') {
        console.error('cartService или метод clearCart не определены');
        return;
      }
      
      // Мгновенно очищаем корзину в UI
      setCartItems({});
      setTotalItems(0);
      
      // Асинхронно очищаем хранилище
      cartService.clearCart().catch(error => {
        console.error('Ошибка при очистке корзины:', error);
        // В случае ошибки восстанавливаем предыдущее состояние
        updateCartCount();
      });
    } catch (error) {
      console.error('Ошибка при очистке корзины:', error);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItems,
        addToCart,
        removeFromCart,
        clearCart,
        updateCartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
} 