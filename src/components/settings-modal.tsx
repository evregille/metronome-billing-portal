"use client";

import { useState, useEffect } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Eye, EyeOff, Check, X, Building2, CreditCard } from "lucide-react";

const METRONOME_API_KEY_STORAGE_KEY = "metronome_api_key";
const BUSINESS_NAME_STORAGE_KEY = "business_name";
const RECHARGE_PRODUCT_ID_STORAGE_KEY = "recharge_product_id";

// Get default business name from environment variable
const DEFAULT_BUSINESS_NAME = process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_NAME || "AcmeCorp";

interface SettingsModalProps {
  onApiKeyChange?: (apiKey: string) => void;
  onBusinessNameChange?: (businessName: string) => void;
  onRechargeProductIdChange?: (rechargeProductId: string) => void;
}

export function SettingsModal({ onApiKeyChange, onBusinessNameChange, onRechargeProductIdChange }: SettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [rechargeProductId, setRechargeProductId] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<"idle" | "success" | "error">("idle");

  // Load settings from localStorage on mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem(METRONOME_API_KEY_STORAGE_KEY);
    const storedBusinessName = localStorage.getItem(BUSINESS_NAME_STORAGE_KEY);
    const storedRechargeProductId = localStorage.getItem(RECHARGE_PRODUCT_ID_STORAGE_KEY);
    
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    if (storedBusinessName) {
      setBusinessName(storedBusinessName);
    } else {
      // Set default business name from environment variable
      setBusinessName(DEFAULT_BUSINESS_NAME);
    }
    if (storedRechargeProductId) {
      setRechargeProductId(storedRechargeProductId);
    }
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) return;

    setIsValidating(true);
    setValidationStatus("idle");

    try {
      // Validate API key by making a test request
      const response = await fetch('/api/validate-metronome-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        // Save to localStorage
        localStorage.setItem(METRONOME_API_KEY_STORAGE_KEY, apiKey.trim());
        localStorage.setItem(BUSINESS_NAME_STORAGE_KEY, businessName);
        localStorage.setItem(RECHARGE_PRODUCT_ID_STORAGE_KEY, rechargeProductId);
        
        setValidationStatus("success");
        
        // Notify parent components
        onApiKeyChange?.(apiKey.trim());
        onBusinessNameChange?.(businessName);
        onRechargeProductIdChange?.(rechargeProductId);
        
        // Dispatch custom event to notify customer context
        window.dispatchEvent(new CustomEvent('apiKeyChanged'));
        
        // Close modal after a short delay
        setTimeout(() => {
          setIsOpen(false);
        }, 1500);
      } else {
        setValidationStatus("error");
      }
    } catch (error) {
      console.error('Error validating API key:', error);
      setValidationStatus("error");
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem(METRONOME_API_KEY_STORAGE_KEY);
    localStorage.removeItem(BUSINESS_NAME_STORAGE_KEY);
    localStorage.removeItem(RECHARGE_PRODUCT_ID_STORAGE_KEY);
    setApiKey("");
    setBusinessName(DEFAULT_BUSINESS_NAME);
    setRechargeProductId("");
    setValidationStatus("idle");
    onApiKeyChange?.("");
    onBusinessNameChange?.(DEFAULT_BUSINESS_NAME);
    onRechargeProductIdChange?.("");
  };

  const getValidationIcon = () => {
    if (validationStatus === "success") {
      return <Check className="w-4 h-4 text-green-600" />;
    }
    if (validationStatus === "error") {
      return <X className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  const getValidationMessage = () => {
    if (validationStatus === "success") {
      return "Settings saved successfully!";
    }
    if (validationStatus === "error") {
      return "Invalid API key. Please check and try again.";
    }
    return "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </DialogTitle>
          <DialogDescription>
            Configure your Metronome API key and customize your dashboard branding.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Business Name Section */}
          <div className="space-y-2">
            <Label htmlFor="business-name" className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span>Business Name</span>
            </Label>
            <Input
              id="business-name"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={`Enter your business name (default: ${DEFAULT_BUSINESS_NAME})`}
            />
            <p className="text-xs text-gray-500">
              This will be displayed in the dashboard header and branding.
            </p>
          </div>

          {/* Recharge Product ID Section */}
          <div className="space-y-2">
            <Label htmlFor="recharge-product-id" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Recharge Product ID (optional)</span>
            </Label>
            <Input
              id="recharge-product-id"
              type="text"
              value={rechargeProductId}
              onChange={(e) => setRechargeProductId(e.target.value)}
              placeholder="Metronome Commit product ID for recharges "
            />
            <p className="text-xs text-gray-500">
              This product ID will be used when creating recharge commits.
            </p>
          </div>

          {/* API Key Section */}
          <div className="space-y-2">
            <Label htmlFor="api-key">Metronome API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Metronome API key"
                className="pr-20"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {/* Security Warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ <strong>IMPORTANT:</strong> Only use SANDBOX API keys. Never use production keys in this demo application.
              </p>
            </div>
            
            {getValidationMessage() && (
              <div className={`flex items-center space-x-2 text-sm ${
                validationStatus === "success" ? "text-green-600" : "text-red-600"
              }`}>
                {getValidationIcon()}
                <span>{getValidationMessage()}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={(!apiKey && businessName === DEFAULT_BUSINESS_NAME) || isValidating}
            className="w-full sm:w-auto"
          >
            Clear API Key
          </Button>
          <Button
            onClick={handleSave}
            disabled={!apiKey.trim() || isValidating}
            className="w-full sm:w-auto"
          >
            {isValidating ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 