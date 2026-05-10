"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import * as XLSX from "xlsx";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Check,
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { CURRENCY_SYMBOL, formatGHS } from "@/lib/currency";

interface APICredential {
  id: string;
  provider: string;
  endpoint: string;
  isActive: boolean;
}

interface PriceList {
  id: string;
  gigAmount: number;
  price: number;
  description?: string;
  isActive: boolean;
}

interface PricingCollection {
  id: string;
  name: string;
  sourceFileName?: string | null;
  isActive: boolean;
}

interface ImportReport {
  filename: string;
  totalRows: number;
  validRows: number;
  invalidRowsCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  invalidRows: Array<{ index: number; reason: string }>;
}

interface PricingRowInput {
  gigAmount: number;
  price: number;
  description: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [credentials, setCredentials] = useState<APICredential[]>([]);
  const [pricingList, setPricingList] = useState<PriceList[]>([]);
  const [pricingCollections, setPricingCollections] = useState<PricingCollection[]>([]);
  const [selectedPricingCollectionId, setSelectedPricingCollectionId] = useState<string>("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const selectedPricingCollectionName =
    pricingCollections.find((item) => item.id === selectedPricingCollectionId)?.name || "";
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [importingPricing, setImportingPricing] = useState(false);
  const [exportingPricing, setExportingPricing] = useState<"csv" | "xlsx" | "none">("none");
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [showImportDetails, setShowImportDetails] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const pricingFileRef = useRef<HTMLInputElement | null>(null);

  // Credential form
  const [credForm, setCredForm] = useState({
    provider: "",
    apiKey: "",
    apiSecret: "",
    endpoint: "",
  });

  // Pricing form
  const [pricingForm, setPricingForm] = useState({
    gigAmount: "",
    price: "",
    description: "",
  });

  const [editingPricingForm, setEditingPricingForm] = useState({
    gigAmount: "",
    price: "",
    description: "",
    isActive: true,
  });

  const fetchCredentials = useCallback(async () => {
    setLoadingCreds(true);
    try {
      const response = await fetch("/api/credentials");
      const data = await response.json();
      if (data.success) {
        setCredentials(data.credentials);
      }
    } catch (error) {
      console.error("Error fetching credentials:", error);
    } finally {
      setLoadingCreds(false);
    }
  }, []);

  const fetchPricing = useCallback(async () => {
    setLoadingPricing(true);
    try {
      const query = selectedPricingCollectionId ? `?pricingCollectionId=${selectedPricingCollectionId}` : "";
      const response = await fetch(`/api/pricing${query}`);
      const data = await response.json();
      if (data.success) {
        setPricingList(data.priceLists);
      }
    } catch (error) {
      console.error("Error fetching pricing:", error);
    } finally {
      setLoadingPricing(false);
    }
  }, [selectedPricingCollectionId]);

  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch("/api/pricing/collections");
      const data = await response.json();
      if (data.success) {
        const collections = data.collections || [];
        setPricingCollections(collections);
        const active = collections.find((item: PricingCollection) => item.isActive);
        if (!selectedPricingCollectionId && active) {
          setSelectedPricingCollectionId(active.id);
        }
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  }, [selectedPricingCollectionId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signin");
    }

    if (status === "authenticated") {
      fetchCredentials();
      fetchCollections();
      fetchPricing();
    }
  }, [status, fetchCollections, fetchCredentials, fetchPricing]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPricing();
    }
  }, [selectedPricingCollectionId, status, fetchPricing]);

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) {
      alert("Please enter a collection name");
      return;
    }

    try {
      const response = await fetch("/api/pricing/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isActive: true }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create collection");
      }

      setNewCollectionName("");
      await fetchCollections();
      setSelectedPricingCollectionId(data.collection.id);
      await fetchPricing();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create collection");
    }
  };

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credForm.provider || !credForm.apiKey || !credForm.endpoint) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const response = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credForm),
      });

      if (response.ok) {
        setCredForm({ provider: "", apiKey: "", apiSecret: "", endpoint: "" });
        fetchCredentials();
        alert("Credentials saved successfully!");
      }
    } catch (error) {
      alert("Error saving credentials");
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      const response = await fetch("/api/credentials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        fetchCredentials();
        alert("Deleted successfully!");
      }
    } catch (error) {
      alert("Error deleting credential");
    }
  };

  const handleAddPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingForm.gigAmount || pricingForm.price === "") {
      alert("Please fill all required fields");
      return;
    }

    const gigAmount = Number(pricingForm.gigAmount);
    const price = Number(pricingForm.price);

    if (!Number.isFinite(gigAmount) || gigAmount <= 0) {
      alert("Gig amount must be a positive number");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      alert("Price must be zero or greater");
      return;
    }

    try {
      const response = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gigAmount,
          price,
          description: pricingForm.description,
          pricingCollectionId: selectedPricingCollectionId || undefined,
        }),
      });

      if (response.ok) {
        setPricingForm({ gigAmount: "", price: "", description: "" });
        fetchPricing();
        alert("Price added successfully!");
      }
    } catch (error) {
      alert("Error adding price");
    }
  };

  const handleDeletePricing = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      const response = await fetch("/api/pricing", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pricingCollectionId: selectedPricingCollectionId || undefined }),
      });

      if (response.ok) {
        fetchPricing();
        alert("Deleted successfully!");
      }
    } catch (error) {
      alert("Error deleting pricing");
    }
  };

  const normalizeHeader = (header: string) =>
    header.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

  const toNumber = (value: unknown): number => {
    if (typeof value === "number") {
      return value;
    }

    const stringValue = String(value ?? "")
      .replace(/[^\d.,-]/g, "")
      .replace(/,/g, "")
      .trim();

    if (!stringValue || stringValue === "-" || stringValue === ".") {
      return Number.NaN;
    }

    const result = Number(stringValue);
    if (!Number.isFinite(result)) {
      console.log("toNumber: could not convert", value, "to number");
      return Number.NaN;
    }
    return result;
  };

  const toBoolean = (value: unknown): boolean => {
    if (typeof value === "boolean") {
      return value;
    }

    const normalized = String(value ?? "").trim().toLowerCase();
    if (!normalized) {
      return true;
    }

    return ["true", "1", "yes", "y", "active", "enabled"].includes(normalized);
  };

  const readExactHeader = (row: Record<string, unknown>, aliases: string[]): unknown => {
    const normalizedAliases = aliases.map((alias) => normalizeHeader(alias));

    for (const alias of normalizedAliases) {
      const value = row[alias];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return value;
      }
    }

    for (const [key, value] of Object.entries(row)) {
      if (value === undefined || value === null || String(value).trim() === "") {
        continue;
      }

      const normalizedKey = normalizeHeader(key);
      if (
        normalizedAliases.some(
          (alias) =>
            normalizedKey === alias ||
            normalizedKey.includes(alias) ||
            alias.includes(normalizedKey)
        )
      ) {
        return value;
      }
    }

    // Debug: if we can't find by alias, log available keys
    if (Object.keys(row).length > 0) {
      const availableKeys = Object.keys(row).filter((k) => String(row[k]).trim() !== "");
      console.log("Could not find alias. Looking for:", aliases, "Available non-empty keys:", availableKeys);
    }

    return "";
  };

  const parseWorkbookRows = (rows: Array<Record<string, unknown>>) => {
    console.log("Parsing workbook rows. Total rows before filter:", rows.length);
    
    // Filter out completely empty rows
    const filteredRows = rows.filter(row => {
      const hasValue = Object.values(row).some(v => v !== undefined && v !== null && String(v).trim() !== "");
      return hasValue;
    });
    
    console.log("Total rows after filtering empty rows:", filteredRows.length);
    
    return filteredRows.map((row, idx) => {
      const normalized: Record<string, unknown> = {};
      Object.entries(row).forEach(([key, value]) => {
        const normalizedKey = normalizeHeader(key);
        normalized[normalizedKey] = value;
      });
      
      if (idx === 0) {
        console.log("First normalized row keys:", Object.keys(normalized));
      }
      
      return normalized;
    });
  };

  const extractPricingRows = (rows: Array<Record<string, unknown>>) => {
    console.log("Extracting pricing rows. Total rows:", rows.length);
    if (rows.length > 0) {
      console.log("First row keys:", Object.keys(rows[0]));
      console.log("First row:", rows[0]);
    }

    return rows.reduce<PricingRowInput[]>((acc, row, index) => {
      const gigAmountRaw = readExactHeader(row, [
        "gigamount",
        "gig",
        "gb",
        "gbs",
        "size",
        "datasize",
        "bundle",
      ]);
      const priceRaw = readExactHeader(row, ["price", "prices"]);
      const descriptionRaw = readExactHeader(row, ["description", "desc", "plan"]);
      const isActiveRaw = readExactHeader(row, ["isactive", "active"]);

      const gigAmount = toNumber(gigAmountRaw);
      const price = toNumber(priceRaw);

      if (index < 3) {
        console.log(`Row ${index}:`, { gigAmountRaw, priceRaw, gigAmount, price });
      }

      if (!Number.isFinite(gigAmount) || gigAmount <= 0 || !Number.isFinite(price) || price < 0) {
        return acc;
      }

      acc.push({
        gigAmount,
        price,
        description: String(descriptionRaw ?? "").trim(),
        isActive: toBoolean(isActiveRaw),
      });

      return acc;
    }, []);
  };

  const uploadPricingRows = async (rows: PricingRowInput[], fileName: string) => {
    if (rows.length === 0) {
      alert("No valid pricing rows were found in that file.");
      return;
    }

    const shouldOverwrite = confirm(
      "Overwrite existing GB entries if they already exist? Click OK to overwrite, Cancel to skip existing rows."
    );

    setImportingPricing(true);
    try {
      const payload = {
        entries: rows,
        overwrite: shouldOverwrite,
        pricingCollectionId: selectedPricingCollectionId || undefined,
        collectionName: selectedPricingCollectionName || undefined,
      };
      
      console.log("Uploading pricing rows. Payload:", payload);
      
      const response = await fetch("/api/pricing/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Server response:", response.status, data);
      
      if (!response.ok) {
        throw new Error(data.error || "Pricing import failed");
      }

      await fetchPricing();
      const summary = data.summary;
      console.log("Import summary:", summary);
      
      setImportReport({
        filename: fileName,
        totalRows: summary?.totalRows || 0,
        validRows: summary?.validRows || 0,
        invalidRowsCount: summary?.invalidRows || 0,
        createdCount: summary?.createdCount || 0,
        updatedCount: summary?.updatedCount || 0,
        skippedCount: summary?.skippedCount || 0,
        invalidRows: data.invalidRows || [],
      });
      setShowImportDetails((data.invalidRows || []).length > 0);
      alert(`Import complete! Created: ${summary?.createdCount || 0}, Updated: ${summary?.updatedCount || 0}, Skipped: ${summary?.skippedCount || 0}, Invalid: ${summary?.invalidRows || 0}`);
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Pricing import failed");
    } finally {
      setImportingPricing(false);
      if (pricingFileRef.current) {
        pricingFileRef.current.value = "";
      }
    }
  };

  const handlePricingFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension !== "csv" && extension !== "xlsx" && extension !== "xls") {
        alert("Unsupported file type. Please use CSV, XLS, or XLSX.");
        return;
      }

      console.log("Processing file:", file.name, "extension:", extension);
      const fileData = extension === "csv" ? await file.text() : await file.arrayBuffer();
      const workbook = XLSX.read(fileData, {
        type: extension === "csv" ? "string" : "array",
      });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) {
        alert("No sheets found in the selected file");
        return;
      }

      console.log("Reading sheet:", firstSheet);
      const worksheet = workbook.Sheets[firstSheet];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: "",
        raw: false,
      });

      console.log("Raw rows from XLSX:", rawRows.length, rawRows);
      const rows = parseWorkbookRows(rawRows);

      console.log("Normalized rows:", rows);
      const pricingRows = extractPricingRows(rows);
      console.log("Extracted pricing rows:", pricingRows.length, pricingRows);
      
      if (pricingRows.length === 0) {
        alert("No valid pricing rows were found in that file. Please check your file format and ensure it has 'gigAmount' and 'price' columns.");
        return;
      }

      await uploadPricingRows(pricingRows, file.name);
    } catch (error) {
      console.error("File processing error:", error);
      alert(error instanceof Error ? error.message : "Failed to process the selected file");
    }
  };

  const startPriceEdit = (price: PriceList) => {
    setEditingPriceId(price.id);
    setEditingPricingForm({
      gigAmount: String(price.gigAmount),
      price: String(price.price),
      description: price.description || "",
      isActive: price.isActive,
    });
  };

  const cancelPriceEdit = () => {
    setEditingPriceId(null);
    setEditingPricingForm({ gigAmount: "", price: "", description: "", isActive: true });
  };

  const savePriceEdit = async (id: string) => {
    const gigAmount = Number(editingPricingForm.gigAmount);
    const price = Number(editingPricingForm.price);

    if (!Number.isFinite(gigAmount) || gigAmount <= 0) {
      alert("Gig amount must be a positive number");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      alert("Price must be zero or greater");
      return;
    }

    try {
      setSavingPriceId(id);
      const response = await fetch("/api/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          gigAmount,
          price,
          description: editingPricingForm.description,
          isActive: editingPricingForm.isActive,
          pricingCollectionId: selectedPricingCollectionId || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update pricing row");
      }

      await fetchPricing();
      cancelPriceEdit();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update pricing row");
    } finally {
      setSavingPriceId(null);
    }
  };

  const togglePriceActive = async (row: PriceList) => {
    try {
      setSavingPriceId(row.id);
      const response = await fetch("/api/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          isActive: !row.isActive,
          pricingCollectionId: selectedPricingCollectionId || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update active state");
      }

      await fetchPricing();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update active state");
    } finally {
      setSavingPriceId(null);
    }
  };

  const handleExportPricing = async (format: "csv" | "xlsx", template = false) => {
    setExportingPricing(format);
    try {
      const url = `/api/pricing/export?format=${format}&template=${template}${selectedPricingCollectionId ? `&pricingCollectionId=${selectedPricingCollectionId}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to export pricing");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const defaultName = template ? `pricing-template.${format}` : `pricing-export.${format}`;
      const contentDisposition = response.headers.get("content-disposition") || "";
      const match = contentDisposition.match(/filename=([^;]+)/);
      anchor.href = objectUrl;
      anchor.download = match?.[1] || defaultName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to export pricing");
    } finally {
      setExportingPricing("none");
    }
  };

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* API Credentials Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Credential Form */}
          <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add API Credentials
            </h2>
            <form onSubmit={handleAddCredential} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider Name *
                </label>
                <select
                  value={credForm.provider}
                  onChange={(e) =>
                    setCredForm({ ...credForm, provider: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Provider</option>
                  <option value="MTN">MTN</option>
                  <option value="Airtel">Airtel</option>
                  <option value="Glo">Glo</option>
                  <option value="Etisalat">Etisalat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key *
                </label>
                <input
                  type="password"
                  value={credForm.apiKey}
                  onChange={(e) =>
                    setCredForm({ ...credForm, apiKey: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter API key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Secret
                </label>
                <input
                  type="password"
                  value={credForm.apiSecret}
                  onChange={(e) =>
                    setCredForm({ ...credForm, apiSecret: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter API secret (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Endpoint *
                </label>
                <input
                  type="url"
                  value={credForm.endpoint}
                  onChange={(e) =>
                    setCredForm({ ...credForm, endpoint: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://api.provider.com/v1/bundles"
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
              >
                <Plus size={18} className="inline mr-2" />
                Add Credentials
              </button>
            </form>
          </div>

          {/* Existing Credentials */}
          <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              API Credentials
            </h2>
            {loadingCreds ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : credentials.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No credentials added yet
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {cred.provider}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {cred.endpoint}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {cred.isActive ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          Inactive
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteCredential(cred.id)}
                        className="p-1 hover:bg-red-100 text-red-600 rounded transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Pricing Form */}
          <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add Pricing
            </h2>
            <div className="mb-4 grid gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saved Pricing Lists</label>
                <select
                  value={selectedPricingCollectionId}
                  onChange={(e) => setSelectedPricingCollectionId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Use active/default list</option>
                  {pricingCollections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}{collection.isActive ? " (active)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="New list name"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleCreateCollection}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                >
                  Create
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => pricingFileRef.current?.click()}
                disabled={importingPricing}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
              >
                <Upload size={16} />
                {importingPricing ? "Importing..." : "Import CSV/XLSX"}
              </button>
              <button
                type="button"
                onClick={() => handleExportPricing("xlsx", true)}
                disabled={exportingPricing !== "none"}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
              >
                <FileSpreadsheet size={16} />
                Download Template
              </button>
            </div>
            {importReport && (
              <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm">
                <p className="font-semibold text-blue-900">Latest Import: {importReport.filename}</p>
                <p className="text-blue-800 mt-1">
                  Total: {importReport.totalRows}, Valid: {importReport.validRows}, Created: {importReport.createdCount}, Updated: {importReport.updatedCount}, Skipped: {importReport.skippedCount}, Invalid: {importReport.invalidRowsCount}
                </p>
                {importReport.invalidRowsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowImportDetails(true)}
                    className="mt-2 inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-100"
                  >
                    View invalid rows
                  </button>
                )}
              </div>
            )}
            <input
              ref={pricingFileRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handlePricingFileSelect}
              className="hidden"
            />
            <form onSubmit={handleAddPricing} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gig Amount (GB) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pricingForm.gigAmount}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, gigAmount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ({CURRENCY_SYMBOL}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pricingForm.price}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, price: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="250"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={pricingForm.description}
                  onChange={(e) =>
                    setPricingForm({ ...pricingForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="5GB - Monthly"
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
              >
                <Plus size={18} className="inline mr-2" />
                Add Price
              </button>
            </form>
          </div>

          {/* Pricing List */}
          <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Pricing Table</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleExportPricing("xlsx")}
                  disabled={exportingPricing !== "none"}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                >
                  <Download size={16} />
                  XLSX
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPricing("csv")}
                  disabled={exportingPricing !== "none"}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                >
                  <Download size={16} />
                  CSV
                </button>
              </div>
            </div>
            {loadingPricing ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : pricingList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pricing added yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-blue-100">
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        GB
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        Price
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        Description
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingList.map((price) => (
                      <tr
                        key={price.id}
                        className="border-b border-blue-50 hover:bg-blue-50/70"
                      >
                        {editingPriceId === price.id ? (
                          <>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.1"
                                value={editingPricingForm.gigAmount}
                                onChange={(e) =>
                                  setEditingPricingForm((prev) => ({ ...prev, gigAmount: e.target.value }))
                                }
                                className="w-24 rounded-lg border border-blue-200 px-2 py-1"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.01"
                                value={editingPricingForm.price}
                                onChange={(e) =>
                                  setEditingPricingForm((prev) => ({ ...prev, price: e.target.value }))
                                }
                                className="w-28 rounded-lg border border-blue-200 px-2 py-1"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={editingPricingForm.description}
                                onChange={(e) =>
                                  setEditingPricingForm((prev) => ({ ...prev, description: e.target.value }))
                                }
                                className="w-full rounded-lg border border-blue-200 px-2 py-1"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingPricingForm((prev) => ({ ...prev, isActive: !prev.isActive }))
                                }
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  editingPricingForm.isActive
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {editingPricingForm.isActive ? "Active" : "Inactive"}
                              </button>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => savePriceEdit(price.id)}
                                  disabled={savingPriceId === price.id}
                                  className="rounded-lg bg-blue-100 p-1.5 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelPriceEdit}
                                  disabled={savingPriceId === price.id}
                                  className="rounded-lg bg-slate-100 p-1.5 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 font-medium text-gray-900">{price.gigAmount} GB</td>
                            <td className="px-3 py-2 text-gray-700">{formatGHS(price.price)}</td>
                            <td className="px-3 py-2 text-gray-600">{price.description || "-"}</td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                disabled={savingPriceId === price.id}
                                onClick={() => togglePriceActive(price)}
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  price.isActive
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {price.isActive ? "Active" : "Inactive"}
                              </button>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => startPriceEdit(price)}
                                  className="p-1.5 hover:bg-blue-100 text-blue-700 rounded transition"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePricing(price.id)}
                                  className="p-1.5 hover:bg-red-100 text-red-600 rounded transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showImportDetails && importReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-blue-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-900">Invalid Import Rows</h3>
              <button
                type="button"
                onClick={() => setShowImportDetails(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>
            {importReport.invalidRows.length === 0 ? (
              <p className="text-sm text-slate-600">No invalid rows in the latest import.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto rounded-lg border border-blue-100">
                <table className="w-full text-sm">
                  <thead className="bg-blue-50 text-blue-900">
                    <tr>
                      <th className="px-4 py-2 text-left">Row</th>
                      <th className="px-4 py-2 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importReport.invalidRows.slice(0, 300).map((item) => (
                      <tr key={`${item.index}-${item.reason}`} className="border-t border-blue-50">
                        <td className="px-4 py-2">{item.index}</td>
                        <td className="px-4 py-2">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
