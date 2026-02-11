"use client";

import { useReducer, useCallback } from "react";
import { VoucherData, VoucherAction } from "@/types/voucher";

function voucherReducer(
  state: VoucherData[],
  action: VoucherAction
): VoucherData[] {
  switch (action.type) {
    case "ADD_VOUCHERS":
      return [...state, ...action.vouchers];
    case "UPDATE_VOUCHER":
      return state.map((v) =>
        v.id === action.id ? { ...v, ...action.fields } : v
      );
    case "REMOVE_VOUCHER":
      return state.filter((v) => v.id !== action.id);
    case "CLEAR_ALL":
      return [];
    default:
      return state;
  }
}

export function useVoucherState() {
  const [vouchers, dispatch] = useReducer(voucherReducer, []);

  const addVouchers = useCallback(
    (newVouchers: VoucherData[]) => {
      dispatch({ type: "ADD_VOUCHERS", vouchers: newVouchers });
    },
    []
  );

  const updateVoucher = useCallback(
    (id: string, fields: Partial<VoucherData>) => {
      dispatch({ type: "UPDATE_VOUCHER", id, fields });
    },
    []
  );

  const removeVoucher = useCallback((id: string) => {
    dispatch({ type: "REMOVE_VOUCHER", id });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: "CLEAR_ALL" });
  }, []);

  return { vouchers, addVouchers, updateVoucher, removeVoucher, clearAll };
}
