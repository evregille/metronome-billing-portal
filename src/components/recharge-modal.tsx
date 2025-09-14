"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreditCard, Loader2, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency, getCoinSymbol } from "@/lib/utils";

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecharge: (amount: number) => Promise<{ success: boolean; message: string }>;
  currencyName: string;
  currentBalance: number;
  rechargeProductId?: string;
}

export function RechargeModal({ 
  isOpen, 
  onClose, 
  onRecharge, 
  currencyName, 
  currentBalance,
  rechargeProductId
}: RechargeModalProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleRecharge = async () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setResult({
        success: false,
        message: "Please enter a valid amount greater than 0"
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const rechargeResult = await onRecharge(numericAmount * 100); // Convert to cents
      setResult(rechargeResult);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setResult(null);
    setIsLoading(false);
    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const getResultIcon = () => {
    if (!result) return null;
    return result.success ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getResultColor = () => {
    if (!result) return "";
    return result.success ? "text-green-600" : "text-red-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Recharge Balance</span>
          </DialogTitle>
          <DialogDescription>
            Add funds to your account balance. Current balance: {formatCurrency(currentBalance, currencyName)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!result ? (
            <>
              {!rechargeProductId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800 font-medium">
                      Recharge Product ID not configured
                    </p>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Please configure a recharge product ID in your settings to enable balance recharging.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="recharge-amount">Recharge Amount</Label>
                <div className="relative">
                  <Input
                    id="recharge-amount"
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="pr-16"
                    disabled={isLoading || !rechargeProductId}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    {getCoinSymbol(currencyName)}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Enter the amount you want to add to your balance
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className={`flex items-center space-x-2 text-sm ${getResultColor()}`}>
                {getResultIcon()}
                <span className="font-medium">
                  {result.success ? "Recharge Successful!" : "Recharge Failed"}
                </span>
              </div>
              <div className={`rounded-lg p-3 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>
              </div>
              {result.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    Your balance has been updated. The changes may take a few moments to reflect.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!result ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecharge}
                disabled={!amount || isLoading || !rechargeProductId}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Recharge
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleClose}
              className="w-full sm:w-auto"
            >
              {result.success ? "Done" : "Try Again"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

