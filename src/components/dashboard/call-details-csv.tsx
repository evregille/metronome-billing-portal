"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomer } from "@/contexts/customer-context";
import { 
  Phone, 
  Clock, 
  User, 
  DollarSign, 
  Search,
  Download,
  Building2
} from "lucide-react";

interface CallData {
  "Call Id": string;
  "Status": string;
  "Call truetime": string;
  "Call duration minutes": string;
  "Duration prorated minutes": string;
  "Scheduled Duration": string;
  "Name [User]": string;
  "Name [Advisor]": string;
  "Expert minimum": string;
  "Name [Project]": string;
  "Full Name [Admin]": string;
  "Name [Firm]": string;
  "FIRM_ID": string;
  "SalesforceID [Firm]": string;
  "Advisor Rate": string;
  "REASON_FOR_ADJUSTMENT": string;
  "ADDITIONAL_NOTES": string;
  "CHARGE_TRANSCRIPT_FEE": string;
  "ADJUSTMENT_AMOUNT": string;
  "ADJUSTMENT_TYPE": string;
  "BILL_CUSTOM_SOURCED_EXPERT": string;
  "BILL_CUSTOM_SOURCED_EXPERT_AMOUNT": string;
  "BILL_LIVE_TRANSLATION": string;
  "BILL_LIVE_TRANSLATION_AMOUNT": string;
  "BILL_OUTSOURCED": string;
  "BILL_OUTSOURCED_AMOUNT": string;
  "BILL_POST_CALL_TRANSLATION": string;
  "BILL_POST_CALL_TRANSLATION_AMOUNT": string;
  "BILL_PAY_TO_DELAY_PRIVATE_MONTHS": string;
  "BILL_PAY_TO_DELAY_PUBLIC_MONTHS": string;
  "BILL_PAY_TO_DELAY_AMOUNT": string;
  "Transcription Fee": string;
  "Invoice Total": string;
  "Project AM": string;
}

export function CallDetailsCSV() {
  const { selectedCustomer } = useCustomer();
  const [callData, setCallData] = useState<CallData[]>([]);
  const [filteredData, setFilteredData] = useState<CallData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<keyof CallData>("Call truetime");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filterAndSortData = useCallback(() => {
    // First filter by selected customer's company name
    let filtered = callData;
    
    if (selectedCustomer) {
      filtered = callData.filter(call => {
        const firmName = call["Name [Firm]"]?.trim();
        const customerName = selectedCustomer.name.trim();
        return firmName === customerName;
      });
    }

    // Then apply search filter
    filtered = filtered.filter(call => 
      call["Call Id"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      call["Name [User]"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      call["Name [Advisor]"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      call["Name [Project]"].toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort the data
    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (sortBy === "Call truetime") {
        const aDate = new Date(aVal);
        const bDate = new Date(bVal);
        return sortOrder === "asc" ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
      }
      
      if (sortBy === "Invoice Total" || sortBy === "Advisor Rate" || sortBy === "Transcription Fee") {
        const aNum = parseFloat(aVal) || 0;
        const bNum = parseFloat(bVal) || 0;
        return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
      }
      
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    setFilteredData(filtered);
  }, [callData, searchTerm, sortBy, sortOrder, selectedCustomer]);

  useEffect(() => {
    fetchCallData();
  }, []);

  useEffect(() => {
    filterAndSortData();
  }, [filterAndSortData]);

  const fetchCallData = async () => {
    try {
      const response = await fetch('/CallData.csv');
      const csvText = await response.text();
      
      // Parse CSV manually since we know the structure
      const lines = csvText.split('\n');
      const headers = lines[0].split(',');
      const data: CallData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',');
          const row: any = {};
          headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || '';
          });
          data.push(row as CallData);
        }
      }
      
      setCallData(data);
    } catch (error) {
      console.error('Error fetching call data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (minutes: string) => {
    const num = parseFloat(minutes);
    if (isNaN(num)) return minutes;
    
    const hours = Math.floor(num / 60);
    const mins = Math.floor(num % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <Card className="glass-card border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Phone className="w-5 h-5 text-blue-600" />
            Call Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading call data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-white/20 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Phone className="w-5 h-5 text-blue-600" />
            Call Details
            {selectedCustomer && (
              <Badge variant="outline" className="ml-2 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {selectedCustomer.name}
              </Badge>
            )}
            <Badge variant="secondary" className="ml-2">
              {filteredData.length} calls
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search calls by ID, user, advisor, or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as keyof CallData)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="Call truetime">Sort by Date</option>
            <option value="Invoice Total">Sort by Total</option>
            <option value="Advisor Rate">Sort by Rate</option>
            <option value="Name [User]">Sort by User</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {filteredData.map((call) => (
            <div
              key={call["Call Id"]}
              className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Call ID and Status */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-900">Call ID</span>
                  </div>
                  <p className="text-sm text-gray-700 font-mono">{call["Call Id"]}</p>
                  <Badge 
                    variant={call["Status"] === "ended" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {call["Status"]}
                  </Badge>
                </div>

                {/* Time and Duration */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-gray-900">Time & Duration</span>
                  </div>
                  <p className="text-sm text-gray-700">{formatDate(call["Call truetime"])}</p>
                  <p className="text-sm text-gray-600">
                    Duration: {formatDuration(call["Duration prorated minutes"])}
                  </p>
                </div>

                {/* User and Advisor */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-gray-900">Participants</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">User:</span> {call["Name [User]"]}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Advisor:</span> {call["Name [Advisor]"]}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Project:</span> {call["Name [Project]"]}
                  </p>
                </div>

                {/* Financial Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-gray-900">Rate</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Advisor Rate:</span> {formatCurrency(call["Advisor Rate"])}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Translation Rate:</span> {formatCurrency(call["BILL_LIVE_TRANSLATION_AMOUNT"])}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Outsourced Rate:</span> {formatCurrency(call["BILL_OUTSOURCED_AMOUNT"])}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Transcription Fee:</span> {formatCurrency(call["Transcription Fee"])}
                    </p>
                    <p className="text-sm font-semibold text-green-700">
                      <span className="font-medium">Total:</span> {formatCurrency(call["Invoice Total"])}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredData.length === 0 && (
            <div className="text-center py-8">
              <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No calls found</h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : selectedCustomer 
                    ? `No call data available for ${selectedCustomer.name}` 
                    : "No call data available"
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
