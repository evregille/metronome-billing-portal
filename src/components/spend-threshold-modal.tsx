"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Target, AlertCircle, XCircle } from "lucide-react";

interface SpendThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateThreshold: (isEnabled?: boolean, spendThresholdAmount?: number) => Promise<{ success: boolean; message: string }>;
  existingSpendThreshold?: any;
  rechargeProductId?: string;
}

export function SpendThresholdModal({ 
  isOpen, 
  onClose, 
  onUpdateThreshold,
  existingSpendThreshold,
  rechargeProductId
}: SpendThresholdModalProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasUserEdited, setHasUserEdited] = useState(false);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && existingSpendThreshold && !hasUserEdited) {
      // Convert from cents to dollars for display
      const amountInDollars = existingSpendThreshold.spend_threshold_amount ? 
        (existingSpendThreshold.spend_threshold_amount / 100).toString() : "";
      setAmount(amountInDollars);
    } else if (isOpen && !existingSpendThreshold && !hasUserEdited) {
      setAmount("");
    }
  }, [isOpen, existingSpendThreshold, hasUserEdited]);

  const handleClose = () => {
    setAmount("");
    setError("");
    setIsLoading(false);
    setHasUserEdited(false);
    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    setHasUserEdited(true);
    setError("");
  };

  const handleUpdateThreshold = async () => {
    if (!amount.trim()) {
      setError("Please enter a spend threshold amount");
      return;
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountInCents) || amountInCents <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await onUpdateThreshold(true, amountInCents);
      if (result.success) {
        handleClose();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Failed to update spend threshold. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = async (isEnabled: boolean) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await onUpdateThreshold(isEnabled);
      if (result.success) {
        handleClose();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Failed to update spend threshold. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>
              {existingSpendThreshold ? "Update Spend Threshold" : "Spend Threshold Setup"}
            </span>
          </DialogTitle>
          <DialogDescription>
            {existingSpendThreshold 
              ? "Update your spend threshold configuration or toggle it on/off."
              : "Set up a spend threshold to be invoiced when your spending reaches the specified amount."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Spend Threshold Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter amount in dollars"
              value={amount}
              onChange={handleAmountChange}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              You'll get charged automatically when your spending reaches this amount
            </p>
          </div>

          {/* Product ID Warning */}
          {!rechargeProductId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-yellow-600" />
                <p className="text-sm text-yellow-800 font-medium">
                  Commit product ID not configured
                </p>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Please configure a commit product ID in your settings to enable spend threshold billing.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Disable/Enable Section - Only show if existing threshold */}
          {existingSpendThreshold && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {existingSpendThreshold.is_enabled ? "Disable Spend Threshold" : "Enable Spend Threshold"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {existingSpendThreshold.is_enabled 
                      ? "Turn off spend threshold alerts"
                      : "Turn on spend threshold alerts"
                    }
                  </p>
                </div>
                <Button
                  onClick={() => handleToggleEnabled(!existingSpendThreshold.is_enabled)}
                  disabled={isLoading}
                  className={`px-4 py-2 ${
                    existingSpendThreshold.is_enabled
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    existingSpendThreshold.is_enabled ? "Disable" : "Enable"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateThreshold} 
            disabled={isLoading || !amount.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {existingSpendThreshold ? "Updating..." : "Setting up..."}
              </>
            ) : (
              existingSpendThreshold ? "Update Spend Threshold" : "Setup Spend Threshold"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
