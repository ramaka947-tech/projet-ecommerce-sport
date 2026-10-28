'use client';
import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Download, Upload, FileSpreadsheet, X, Loader2, CheckCircle2, AlertTriangle, ImagePlus, FolderPlus,
} from 'lucide-react';
import { createProduct, createCategory, getAdminProducts, uploadImage as apiUploadImage } from '@/lib/api';

/* ----------------------------- Helpers ----------------------------- */
const isUrl = (s: string) => /^https?:\/\//i.test(s);
const normName = (s: string) => s.normalize('NFC').toLowerCase().trim();
const baseName = (s: string) => normName(s.split(/[\\/]/).pop() || '');
const splitList = (v: any): string[] =>
  v ? String(v).split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [];

const IMG_EXT = /\.(jpe?g|png|webp|gif|avif|bmp)/i;
const splitImages = (v: any): string[] => {
  if (!v) return [];
  const str = String(v).trim();
  const parts = !isUrl(str) && IMG_EXT.test(str)
    ? str.split(/(?<=\.(?:jpe?g|png|webp|gif|avif|bmp))\s*[,;]\s*/i)
    : str.split(/[,;]/);
  return parts.map((s) => s.trim()).filter(Boolean);
};
const getImageTokens = (row: any): string[] =>
  splitImages(row['Images'] ?? row['Images (liens séparés par virgule)']);

async function compress(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 800_000) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b || file), 'image/jpeg', 0.85));
  } catch {
    return file;
  }
}

async function uploadImage(file: File): Promise<string> {
  const blob = await compress(file);
  const toSend = new File([blob], file.name, { type: blob.type || file.type });
  return apiUploadImage(toSend);
}

async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const item = items[i++];
        await worker(item);
      }
    })
  );
}

/* ----------------------------- Composant ---------------------------- */
export default function ProductImportExport({ categories, onSuccess }: { categories: any[]; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'choice' | 'preview'>('choice');
  const [importedData, setImportedData] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, label: '' });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, text });
    toastTimer.current = setTimeout(() => setToast(null), type === 'error' ? 15000 : 5000);
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setStep('choice');
    setImportedData([]);
    setImageFiles([]);
    setProgress({ done: 0, total: 0, label: '' });
  };

  const fileMap = useMemo(() => {
    const m = new Map<string, File>();
    imageFiles.forEach((f) => m.set(normName(f.name), f));
    return m;
  }, [imageFiles]);

  const analysis = useMemo(() => {
    const missing = new Set<string>();
    const unknownCats = new Set<string>();
    const rows = importedData.map((row) => {
      const cname = String(row['Catégorie'] ?? '').trim();
      if (!categories.some((c) => c.name.toLowerCase() === cname.toLowerCase())) unknownCats.add(cname || '(vide)');
      const tokens = getImageTokens(row);
      let found = 0;
      tokens.forEach((t) => {
        if (isUrl(t) || fileMap.has(baseName(t))) found++;
        else missing.add(baseName(t));
      });
      return { total: tokens.length, found };
    });
    return { rows, missing: Array.from(missing), unknownCats: Array.from(unknownCats) };
  }, [importedData, fileMap, categories]);

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        Nom: 'Chaussures de running', SKU: 'RUN-001', Description: 'Super chaussures',
        'Description Courte': 'Idéal pour le sport', Prix: 25000, 'Prix Promo': '', Stock: 10,
        Catégorie: 'Running', Marques: 'Nike, Adidas', Tailles: '40, 41, 42', Couleurs: 'Rouge, Noir',
        Images: 'run-001-a.jpg, run-001-b.jpg', 'En avant': 'NON',
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modèle');
    XLSX.writeFile(wb, 'modele_produits_ad-sport-solutions.xlsx');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const products = await getAdminProducts();
      const excelData = products.map((p: any) => ({
        Nom: p.name, SKU: p.sku, Description: p.description || '', 'Description Courte': p.shortDescription || '',
        Prix: p.price, 'Prix Promo': p.promoPrice || '', Stock: p.stock, Catégorie: p.category?.name || '',
        Marques: p.brands?.join(', ') || '', Tailles: p.sizes?.join(', ') || '', Couleurs: p.colors?.join(', ') || '',
        Images: p.images?.join(', ') || '', 'En avant': p.isFeatured ? 'OUI' : 'NON',
      }));
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Produits');
      XLSX.writeFile(wb, `ad-sport-solutions_produits_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('success', 'Export terminé.');
    } catch {
      showToast('error', "Erreur lors de l'exportation.");
    } finally {
      setExporting(false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json<any>(wb.Sheets[wb.SheetNames[0]]);
      if (rows.length === 0) return showToast('error', 'Le fichier est vide.');
      setImportedData(rows);
      setStep('preview');
    } catch {
      showToast('error', 'Fichier illisible. Utilisez le modèle Excel.');
    }
  };

  const handleImagesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    setImageFiles((prev) => {
      const m = new Map(prev.map((f) => [normName(f.name), f]));
      files.forEach((f) => m.set(normName(f.name), f));
      return Array.from(m.values());
    });
  };

  const handleConfirmImport = async () => {
    const needsFiles = importedData.some((r) => getImageTokens(r).some((t) => !isUrl(t)));
    if (needsFiles && imageFiles.length === 0) {
      showToast('error', "Votre Excel contient des noms de photos : cliquez d'abord sur « Choisir les images » et sélectionnez-les.");
      return;
    }
    setImporting(true);
    const urlCache = new Map<string, string>();
    const failedUploads = new Map<string, string>();

    try {
      const names = Array.from(
        new Set(importedData.flatMap((r) => getImageTokens(r).filter((t) => !isUrl(t)).map(baseName)))
      ).filter((n) => fileMap.has(n));

      const catMap = new Map<string, string>();
      categories.forEach((c) => catMap.set(String(c.name).trim().toLowerCase(), c.id));
      const newCats = new Map<string, string>();
      importedData.forEach((r) => {
        const n = String(r['Catégorie'] ?? '').trim();
        if (n && !catMap.has(n.toLowerCase())) newCats.set(n.toLowerCase(), n);
      });
      const catErrors = new Map<string, string>();

      const total = names.length + newCats.size + importedData.length;
      let done = 0;
      const bump = (label: string) => setProgress({ done: ++done, total, label });
      setProgress({ done: 0, total, label: 'Envoi des images…' });

      await runPool(names, 4, async (name) => {
        try {
          urlCache.set(name, await uploadImage(fileMap.get(name)!));
        } catch (err: any) {
          console.error('Upload échoué :', name, err);
          failedUploads.set(name, err?.message || 'erreur inconnue');
        }
        bump('Envoi des images…');
      });

      for (const [key, name] of newCats) {
        try {
          const created: any = await createCategory({ name });
          const id = created?.id ?? created?.data?.id;
          if (!id) throw new Error('réponse inattendue du serveur');
          catMap.set(key, id);
        } catch (err: any) {
          catErrors.set(key, err.message);
        }
        bump('Création des catégories…');
      }

      let ok = 0;
      let noImage = 0;
      const errors: string[] = [];
      for (const row of importedData) {
        const catKey = String(row['Catégorie'] ?? '').trim().toLowerCase();
        const categoryId = catMap.get(catKey);
        if (!categoryId) {
          errors.push(`${row['SKU']} : catégorie « ${row['Catégorie'] || 'vide'} » introuvable${catErrors.get(catKey) ? ' (' + catErrors.get(catKey) + ')' : ''}`);
          bump('Création des produits…');
          continue;
        }
        const images = getImageTokens(row)
          .map((t) => (isUrl(t) ? t : urlCache.get(baseName(t))))
          .filter(Boolean) as string[];
        try {
          await createProduct({
            name: row['Nom'], sku: String(row['SKU']),
            description: row['Description'] || '', shortDescription: row['Description Courte'] || null,
            price: Number(row['Prix']), promoPrice: row['Prix Promo'] ? Number(row['Prix Promo']) : null,
            stock: Number(row['Stock']) || 0,
            categoryId,
            brands: splitList(row['Marques']), sizes: splitList(row['Tailles']), colors: splitList(row['Couleurs']),
            images, isPublished: true, isFeatured: row['En avant'] === 'OUI',
          });
          ok++;
          if (images.length === 0 && getImageTokens(row).length > 0) noImage++;
        } catch (err: any) {
          console.error('Création produit échouée :', row['SKU'], err);
          errors.push(`${row['SKU']} : ${err.message}`);
        }
        bump('Création des produits…');
      }

      onSuccess();
      if (errors.length === 0 && failedUploads.size === 0 && noImage === 0) {
        showToast('success', `${ok} produit${ok > 1 ? 's' : ''} importé${ok > 1 ? 's' : ''} avec succès.`);
      } else {
        const parts = [`${ok} importé${ok > 1 ? 's' : ''}`];
        if (errors.length) parts.push(`${errors.length} en erreur (${errors[0]})`);
        if (failedUploads.size) parts.push(`${failedUploads.size} image(s) non envoyée(s) (${Array.from(failedUploads.values())[0]})`);
        if (noImage) parts.push(`${noImage} produit(s) créé(s) sans image`);
        showToast('error', parts.join(' · '));
      }
      resetAndClose();
    } catch (err: any) {
      showToast('error', 'Erreur : ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <>
      <style>{`@keyframes toast-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-line bg-white px-5 font-semibold text-ink shadow-sm transition hover:border-action sm:w-auto md:min-h-0 md:py-2.5"
      >
        <FileSpreadsheet size={18} /> Importer / Exporter
      </button>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          style={{ animation: 'toast-in .25s ease-out' }}
          className={`fixed bottom-4 left-4 right-4 z-[60] flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm ${
            toast.type === 'success' ? 'border-success/40 text-success' : 'border-action/40 text-action'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={20} className="mt-0.5 shrink-0" /> : <AlertTriangle size={20} className="mt-0.5 shrink-0" />}
          <p className="min-w-0 flex-1 text-sm font-medium text-ink">{toast.text}</p>
          <button onClick={() => setToast(null)} aria-label="Fermer" className="shrink-0 text-ink/40 hover:text-ink"><X size={16} /></button>
        </div>
      )}

      {/* Modale */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-3 backdrop-blur-sm sm:p-8">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-h-[85vh]">
            <div className="flex shrink-0 items-center justify-between border-b border-line bg-canvas/30 p-4 sm:p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink sm:text-xl">
                <FileSpreadsheet className="text-action" /> Gestion Excel
              </h2>
              <button onClick={resetAndClose} disabled={importing} aria-label="Fermer" className="flex size-10 items-center justify-center rounded-lg text-ink/50 hover:text-action disabled:opacity-30">
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6">
              {step === 'choice' ? (
                <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                  <div className="flex flex-col justify-between rounded-xl border border-line p-4 text-center sm:p-5">
                    <div>
                      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-action/10 text-action"><Upload size={24} /></div>
                      <h3 className="mb-2 font-bold text-ink">Importer des produits</h3>
                      <p className="mb-4 text-xs text-ink/60">
                        Dans la colonne « Images », mettez des noms de fichiers (photo1.jpg) ou des liens https.
                        Vous sélectionnerez ensuite les photos de votre ordinateur.
                      </p>
                    </div>
                    <div>
                      <button onClick={downloadTemplate} className="mb-4 flex w-full items-center justify-center gap-1 text-sm font-semibold text-action hover:underline">
                        <Download size={14} /> Télécharger le modèle Excel
                      </button>
                      <label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-ink px-4 font-semibold text-white transition hover:bg-ink/90">
                        Choisir le fichier Excel
                        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-line p-4 text-center sm:p-5">
                    <div>
                      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-success/10 text-success"><Download size={24} /></div>
                      <h3 className="mb-2 font-bold text-ink">Exporter le catalogue</h3>
                      <p className="mb-4 text-xs text-ink/60">Téléchargez vos produits avec les liens des images.</p>
                    </div>
                    <button onClick={handleExport} disabled={exporting} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-line px-4 font-semibold text-ink transition hover:border-action disabled:opacity-50">
                      {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      {exporting ? 'Exportation...' : 'Exporter les produits'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold text-ink">Prévisualisation ({importedData.length} lignes)</h3>
                    <button onClick={() => { setStep('choice'); setImportedData([]); }} disabled={importing} className="text-sm text-ink/50 underline hover:text-ink">
                      Changer de fichier
                    </button>
                  </div>

                  {/* Sélecteur d'images */}
                  <div className="mb-4 flex flex-col gap-3 rounded-xl border border-dashed border-line bg-canvas/30 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div className="min-w-0 text-sm">
                      <p className="flex items-center gap-2 font-semibold text-ink"><ImagePlus size={16} className="text-action" /> Photos des produits</p>
                      <p className="mt-0.5 text-xs text-ink/60">
                        {imageFiles.length > 0
                          ? `${imageFiles.length} image(s) sélectionnée(s)`
                          : "Ouvrez votre dossier d'images, faites Ctrl+A, puis validez."}
                      </p>
                    </div>
                    <label className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-action">
                      {imageFiles.length > 0 ? 'Ajouter' : 'Choisir les images'}
                      <input type="file" accept="image/*" multiple onChange={handleImagesSelected} className="hidden" />
                    </label>
                  </div>

                  {analysis.unknownCats.length > 0 && (
                    <div className="mb-4 flex gap-2 rounded-lg border border-line bg-canvas/60 p-3 text-xs text-ink/80">
                      <FolderPlus size={16} className="shrink-0 text-action" />
                      <p>
                        Ces catégories n'existent pas encore et seront <span className="font-semibold">créées automatiquement</span> :{' '}
                        <span className="font-semibold">{analysis.unknownCats.join(', ')}</span>.
                        Vos catégories actuelles ne sont pas modifiées.
                      </p>
                    </div>
                  )}

                  {imageFiles.length > 0 && analysis.missing.length > 0 && (
                    <div className="mb-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      <AlertTriangle size={16} className="shrink-0" />
                      <p>
                        {analysis.missing.length} image(s) du fichier Excel ne figurent pas dans vos photos sélectionnées :{' '}
                        <span className="font-semibold">{analysis.missing.slice(0, 5).join(', ')}{analysis.missing.length > 5 ? '…' : ''}</span>.
                        Les produits seront créés sans ces images.
                      </p>
                    </div>
                  )}

                  <div className="max-h-60 overflow-auto rounded-lg border border-line">
                    <table className="w-full whitespace-nowrap text-left text-xs sm:text-sm">
                      <thead className="sticky top-0 bg-canvas/50">
                        <tr>
                          <th className="px-2 py-2 sm:px-4">Nom</th>
                          <th className="px-2 py-2 sm:px-4">SKU</th>
                          <th className="px-2 py-2 sm:px-4">Prix</th>
                          <th className="px-2 py-2 sm:px-4">Stock</th>
                          <th className="px-2 py-2 sm:px-4">Images</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {importedData.map((row, i) => {
                          const a = analysis.rows[i];
                          const complete = a.found === a.total;
                          return (
                            <tr key={i} className="hover:bg-canvas/30">
                              <td className="px-2 py-2 sm:px-4">{row['Nom']}</td>
                              <td className="px-2 py-2 sm:px-4">{row['SKU']}</td>
                              <td className="px-2 py-2 sm:px-4">{row['Prix']}</td>
                              <td className="px-2 py-2 sm:px-4">{row['Stock']}</td>
                              <td className={`px-2 py-2 font-medium sm:px-4 ${a.total === 0 ? 'text-ink/30' : complete ? 'text-success' : 'text-amber-600'}`}>
                                {a.total === 0 ? '—' : `${a.found}/${a.total}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {importing && (
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs text-ink/60">
                        <span className="min-w-0 truncate">{progress.label}</span>
                        <span className="shrink-0">{progress.done}/{progress.total}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-line">
                        <div className="h-full bg-action transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                    <button onClick={resetAndClose} disabled={importing} className="min-h-11 rounded-lg px-5 text-sm font-semibold text-ink/60 hover:text-ink disabled:opacity-30 sm:min-h-0 sm:py-2.5">
                      Annuler
                    </button>
                    <button onClick={handleConfirmImport} disabled={importing} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-action px-6 text-sm font-semibold text-white transition hover:bg-action-dark disabled:opacity-60 sm:min-h-0 sm:py-2.5">
                      {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {importing ? 'Importation...' : "Confirmer l'importation"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}