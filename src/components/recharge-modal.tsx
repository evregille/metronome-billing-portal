"use client";

import React, { useState } from "react";
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
  onRecharge: (amount: number, threshold?: number) => Promise<{ success: boolean; message: string }>;
  onUpdateAutoRecharge?: (isEnabled?: boolean, thresholdAmount?: number, rechargeToAmount?: number) => Promise<{ success: boolean; message: string }>;
  currencyName: string;
  currentBalance: number;
  rechargeProductId?: string;
  isAutoRecharge?: boolean; // Flag to determine if this is auto recharge modal
  existingAutoRecharge?: any; // Existing auto recharge configuration
}

export function RechargeModal({ 
  isOpen, 
  onClose, 
  onRecharge, 
  onUpdateAutoRecharge,
  currencyName, 
  currentBalance,
  rechargeProductId,
  isAutoRecharge = false,
  existingAutoRecharge
}: RechargeModalProps) {
  const [amount, setAmount] = useState("");
  const [threshold, setThreshold] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasUserEdited, setHasUserEdited] = useState(false);

  // Initialize with existing values when modal opens
  React.useEffect(() => {
    if (isOpen && existingAutoRecharge && isAutoRecharge && !hasUserEdited) {
      setAmount((existingAutoRecharge.recharge_to_amount/100).toString() || "");
      setThreshold((existingAutoRecharge.threshold_amount/100).toString() || "");
    } else if (isOpen && !hasUserEdited) {
      setAmount("");
      setThreshold("");
    }
  }, [isOpen, existingAutoRecharge, isAutoRecharge, hasUserEdited]);

  const handleRecharge = async () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setResult({
        success: false,
        message: "Please enter a valid amount greater than 0"
      });
      return;
    }

    let numericThreshold: number | undefined;
    if (isAutoRecharge) {
      numericThreshold = parseFloat(threshold);
      if (isNaN(numericThreshold) || numericThreshold <= 0) {
        setResult({
          success: false,
          message: "Please enter a valid threshold amount greater than 0"
        });
        return;
      }
    }

    setIsLoading(true);
    setResult(null);

    try {
      let rechargeResult;
      
      // If we have existing auto recharge config and update function, use update
      if (existingAutoRecharge && onUpdateAutoRecharge && isAutoRecharge) {
        rechargeResult = await onUpdateAutoRecharge(
          true, // isEnabled
          numericThreshold ? numericThreshold * 100 : undefined, // threshold in cents
          numericAmount * 100 // recharge amount in cents
        );
      } else {
        // Otherwise use the regular recharge function
        rechargeResult = await onRecharge(
          numericAmount * 100, // Convert to cents
          numericThreshold ? numericThreshold * 100 : undefined // Convert threshold to cents if provided
        );
      }
      
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
    setThreshold("");
    setResult(null);
    setIsLoading(false);
    setHasUserEdited(false);
    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setHasUserEdited(true);
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
            <span>
              {isAutoRecharge 
                ? (existingAutoRecharge ? "Update Auto Recharge" : "Auto Recharge Setup")
                : "Recharge Balance"
              }
            </span>
          </DialogTitle>
          <DialogDescription>
            {isAutoRecharge 
              ? (existingAutoRecharge 
                  ? "Update your automatic recharging configuration or toggle it on/off."
                  : "Set up automatic recharging when your balance falls below the threshold."
                )
              : "Add funds to your account balance."
            } Current balance: {formatCurrency(currentBalance, currencyName)}
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
                      Commit product ID not configured
                    </p>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Please configure a commit product ID in your settings to enable balance recharging.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="recharge-amount">
                  {isAutoRecharge ? "Amount to recharge" : "Recharge Amount"}
                </Label>
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
                  {isAutoRecharge 
                    ? "Amount to recharge to when threshold is reached"
                    : "Enter the amount you want to add to your balance"
                  }
                </p>
              </div>

              {isAutoRecharge && (
                <div className="space-y-2">
                  <Label htmlFor="threshold-amount">Recharge when the balance reaches</Label>
                  <div className="relative">
                    <Input
                      id="threshold-amount"
                      type="text"
                      value={threshold}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setThreshold(value);
                          setHasUserEdited(true);
                        }
                      }}
                      placeholder="0.00"
                      className="pr-16"
                      disabled={isLoading || !rechargeProductId}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      {getCoinSymbol(currencyName)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Automatically recharge when balance falls below this amount
                  </p>
                </div>
              )}

              {isAutoRecharge && existingAutoRecharge && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {existingAutoRecharge.is_enabled ? "Disable Auto Recharge" : "Enable Auto Recharge"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {existingAutoRecharge.is_enabled 
                          ? "Turn off automatic recharging" 
                          : "Turn on automatic recharging"
                        }
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className={existingAutoRecharge.is_enabled 
                        ? "border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                        : "border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400"
                      }
                      onClick={async () => {
                        if (onUpdateAutoRecharge) {
                          setIsLoading(true);
                          setResult(null);
                          try {
                            const newEnabledState = !existingAutoRecharge.is_enabled;
                            const result = await onUpdateAutoRecharge(newEnabledState);
                            setResult(result);
                            if (result.success) {
                              // Close modal after successful toggle
                              setTimeout(() => {
                                handleClose();
                              }, 2000);
                            }
                          } catch (error) {
                            setResult({
                              success: false,
                              message: error instanceof Error ? error.message : `Failed to ${existingAutoRecharge.is_enabled ? 'disable' : 'enable'} auto recharge`
                            });
                          } finally {
                            setIsLoading(false);
                          }
                        }
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {existingAutoRecharge.is_enabled ? "Disabling..." : "Enabling..."}
                        </>
                      ) : (
                        existingAutoRecharge.is_enabled ? "Disable" : "Enable"
                      )}
                    </Button>
                  </div>
                </div>
              )}
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
                    {isAutoRecharge 
                      ? "Auto recharge has been configured successfully. Your balance will be automatically recharged when it falls below the threshold."
                      : "Your balance has been updated. The changes may take a few moments to reflect."
                    }
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
                disabled={!amount || (isAutoRecharge && !threshold) || isLoading || !rechargeProductId}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isAutoRecharge ? "Setting up..." : "Processing..."}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {isAutoRecharge 
                      ? (existingAutoRecharge ? "Update Auto Recharge" : "Setup Auto Recharge")
                      : "Recharge"
                    }
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

