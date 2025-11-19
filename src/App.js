import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";

export default function MadaPerfectApp() {

  /* ============================
      1) VIEW PRINCIPALE
  ============================ */
  const [view, setView] = useState("dashboard");

  /* ============================
      2) ENTREPRISE
  ============================ */
  const [company, setCompany] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mp_company")) || {
        name: "Mada Perfect",
        nif: "",
        stat: "",
        address: "",
        contact: "",
        logo: "",
      };
    } catch {
      return { name: "Mada Perfect", nif: "", stat: "", logo: "" };
    }
  });

  /* ============================
      3) PRODUITS
  ============================ */
  const [products, setProducts] = useState(() =>
    JSON.parse(localStorage.getItem("mp_products") || "[]")
  );

  const [productSearch, setProductSearch] = useState("");

  const emptyProduct = {
    id: null,
    name: "",
    price: "",
    image: "",
    description: "",
    link: "",
  };

  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProduct, setEditingProduct] = useState(false);

  function handleProductImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) =>
      setProductForm((p) => ({ ...p, image: e.target.result }));
    reader.readAsDataURL(file);
  }

  function startEditProduct(p) {
    setProductForm(p);
    setEditingProduct(true);
    setView("articles");
  }

  function cancelProduct() {
    setProductForm(emptyProduct);
    setEditingProduct(false);
  }

  function saveProduct() {
    if (!productForm.name) return alert("Nom du produit requis");

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((x) => (x.id === productForm.id ? { ...productForm } : x))
      );
    } else {
      setProducts((prev) => [
        ...prev,
        { ...productForm, id: Date.now() },
      ]);
    }

    cancelProduct();
  }

  function deleteProduct(id) {
    if (confirm("Supprimer ce produit ?"))
      setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  /* ============================
      4) CLIENTS
  ============================ */
  const [clients, setClients] = useState(() =>
    JSON.parse(localStorage.getItem("mp_clients") || "[]")
  );

  const emptyClient = { id: null, name: "", email: "", phone: "", address: "" };

  const [clientForm, setClientForm] = useState(emptyClient);

  function saveClient() {
    if (!clientForm.name) return alert("Nom du client requis");

    if (clientForm.id) {
      setClients((prev) =>
        prev.map((c) => (c.id === clientForm.id ? clientForm : c))
      );
    } else {
      setClients((prev) => [
        ...prev,
        { ...clientForm, id: Date.now() },
      ]);
    }

    setClientForm(emptyClient);
  }

  function editClient(c) {
    setClientForm(c);
    setView("clients");
  }

  function deleteClient(id) {
    if (confirm("Supprimer ce client ?"))
      setClients((prev) => prev.filter((c) => c.id !== id));
  }
  /* ============================
      5) FACTURES
  ============================ */
  const [invoices, setInvoices] = useState(() =>
    JSON.parse(localStorage.getItem("mp_invoices") || "[]")
  );

  const [invoiceSearch, setInvoiceSearch] = useState("");

  const [editingInvoice, setEditingInvoice] = useState(false);

  const [invoiceDraft, setInvoiceDraft] = useState({
    id: null,
    clientId: null,
    items: [],
    type: "commercial",
    date: new Date().toISOString().slice(0, 10),
    deliveryDate: "",
    deliveryAddress: "",
    paid: 0,
    number: ""
  });

  /* ---------------------------
      Ajouter un produit au draft
  ----------------------------*/
  function addItemToDraft(productId) {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setInvoiceDraft((d) => ({
      ...d,
      items: [
        ...d.items,
        {
          id: Date.now(),
          productId: prod.id,
          name: prod.name,
          qty: 1,
          price: Number(prod.price || 0),
        },
      ],
    }));
  }

  function updateItemQty(itemId, qty) {
    setInvoiceDraft((d) => ({
      ...d,
      items: d.items.map((it) =>
        it.id === itemId ? { ...it, qty: Number(qty) } : it
      ),
    }));
  }

  function removeItemFromDraft(itemId) {
    setInvoiceDraft((d) => ({
      ...d,
      items: d.items.filter((it) => it.id !== itemId),
    }));
  }

  /* ---------------------------
      CRÉATION NOUVELLE FACTURE
  ----------------------------*/
  function saveInvoice() {
    if (!invoiceDraft.clientId)
      return alert("Sélectionner un client");

    const inv = {
      ...invoiceDraft,
      id: Date.now(),
      number: `INV-${Date.now()}`,
    };

    setInvoices((prev) => [...prev, inv]);

    resetInvoiceDraft();
    setView("invoices");
  }

  /* ---------------------------
      MODE ÉDITION FACTURE
  ----------------------------*/
  function startEditInvoice(inv) {
    setInvoiceDraft({
      id: inv.id,
      clientId: inv.clientId,
      items: inv.items,
      type: inv.type,
      date: inv.date,
      deliveryDate: inv.deliveryDate || "",
      deliveryAddress: inv.deliveryAddress || "",
      paid: inv.paid || 0,
      number: inv.number
    });

    setEditingInvoice(true);
    setView("invoices");
  }

  /* ---------------------------
      SAUVEGARDER MODIFICATION
  ----------------------------*/
  function updateInvoice() {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.number === invoiceDraft.number ? { ...invoiceDraft } : inv
      )
    );

    alert("Facture mise à jour !");
    setEditingInvoice(false);

    resetInvoiceDraft();
  }

  /* ---------------------------
      RESET FACTURE DRAFT
  ----------------------------*/
  function resetInvoiceDraft() {
    setInvoiceDraft({
      id: null,
      clientId: null,
      items: [],
      type: "commercial",
      date: new Date().toISOString().slice(0, 10),
      deliveryDate: "",
      deliveryAddress: "",
      paid: 0,
      number: ""
    });
  }

  /* ---------------------------
      PAIEMENT FACTURE
  ----------------------------*/
  function editInvoice(inv) {
    const nouveauPaiement = Number(
      prompt("Montant payé par le client (en Ariary) :", inv.paid || 0)
    );

    if (isNaN(nouveauPaiement)) return alert("Montant invalide !");

    const newInvoices = invoices.map((f) =>
      f.id === inv.id ? { ...f, paid: nouveauPaiement } : f
    );

    setInvoices(newInvoices);
    alert("Paiement mis à jour !");
  }

  /* ---------------------------
      FUNCTION : FORMAT MG (prix)
  ----------------------------*/
  function formatMG(num) {
    return Number(num || 0).toLocaleString("fr-FR") + " MGA";
  }

  /* ---------------------------
      CONVERSION NOMBRE → MOTS
  ----------------------------*/
  function numberToWordsMG(num) {
    const unités = ["zéro","un","deux","trois","quatre","cinq","six","sept","huit","neuf"];
    const dizaines = ["","dix","vingt","trente","quarante","cinquante","soixante"];

    if (num < 10) return unités[num];
    if (num < 70) {
      let d = Math.floor(num / 10);
      let u = num % 10;
      return dizaines[d] + (u > 0 ? " " + unités[u] : "");
    }
    if (num < 100) return "soixante " + numberToWordsMG(num - 60);
    if (num < 1000) {
      let c = Math.floor(num / 100);
      let r = num % 100;
      return unités[c] + " cent " + (r > 0 ? numberToWordsMG(r) : "");
    }
    if (num < 1000000) {
      let m = Math.floor(num / 1000);
      let r = num % 1000;
      return numberToWordsMG(m) + " mille " + (r > 0 ? numberToWordsMG(r) : "");
    }
    return num.toString();
  }

  /* ---------------------------
      GÉNÉRATION PDF (corrigée)
  ----------------------------*/
  function generateInvoicePDF(inv) {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 40;
    const margin = 20;

    // Récupération client
    const client = clients.find(c => c.id === inv.clientId);
    if (!client) return alert("Client introuvable !");

    function parsePrice(value) {
      if (!value) return 0;
      return Number(String(value).replace(/\D/g, "")) || 0;
    }

    const total = inv.items.reduce(
      (a, b) => a + (b.qty || 0) * parsePrice(b.price),
      0
    );
    const paid = inv.paid || 0;
    const rest = total - paid;

    // 🏢 EN-TÊTE ENTREPRISE
    doc.setFontSize(12);
    doc.text(company.name || "", margin, y); y += 16;
    doc.text(`NIF : ${company.nif}   STAT : ${company.stat}`, margin, y); y += 16;
    doc.text(`Adresse : ${company.address || ""}`, margin, y); y += 16;
    doc.text(`Contact : ${company.contact || ""}`, margin, y); y += 26;

    // TITRE FACTURE
    doc.setFontSize(16);
    doc.text(
      inv.type === "proforma" ? "FACTURE PROFORMA" : "FACTURE COMMERCIALE",
      margin,
      y
    );
    y += 26;

    // --- INFO FACTURE + LIVRAISON ---
    doc.setFontSize(11);
    let leftX = 10;
    let rightX = 300;

    doc.text(`Date facture : ${inv.date}`, leftX, y);
    doc.text(`Facture No : ${inv.number}`, rightX, y);
    y += 16;

    doc.text(`Date de livraison : ${inv.deliveryDate || "Non définie"}`, rightX, y);
    y += 16;

    doc.text(`Lieu de livraison : ${inv.deliveryAddress || "Non défini"}`, rightX, y);
    y += 20;

    // CLIENT
    doc.setFontSize(13);
    doc.text("D o i t :", margin, y); y += 16;
    doc.setFontSize(12);
    doc.text(client.name, margin, y); y += 16;
    doc.text(client.address || "", margin, y); y += 16;
    doc.text(client.phone || "", margin, y); y += 26;

    // TABLEAU
    doc.line(margin, y, 550, y);
    y += 14;

    doc.text("Quantité", margin, y);
    doc.text("Désignation", margin + 80, y);
    doc.text("Prix unitaire", margin + 260, y);
    doc.text("Montant Total", margin + 400, y);
    y += 10;

    doc.line(margin, y, 550, y);
    y += 14;

    inv.items.forEach((item) => {
      const montant = (item.qty || 0) * parsePrice(item.price);

      doc.text(String(item.qty), margin, y);
      doc.text(item.name, margin + 80, y);
      doc.text(formatMG(item.price), margin + 260, y);
      doc.text(formatMG(montant), margin + 390, y);

      y += 16;
    });

    // TOTAUX
    doc.line(margin, y, 550, y);
    y += 20;

    doc.text("Total:", margin + 320, y);
    doc.text(formatMG(total), margin + 390, y); y += 16;

    doc.text("Payé:", margin + 320, y);
    doc.text(formatMG(paid), margin + 390, y); y += 16;

    doc.text("Reste:", margin + 320, y);
    doc.text(formatMG(rest), margin + 390, y); y += 26;

    // TEXTE FINAL
    const typeLabel = inv.type === "proforma" ? "Proforma" : "Commerciale";
    const texteFinal =
      "Arrêtée la présente facture " +
      typeLabel +
      " à la somme : " +
      numberToWordsMG(total) +
      " Ariary";

    doc.text(texteFinal, margin, y);
    y += 26;

    doc.text("Merci pour votre confiance.", margin, y);

    doc.save(inv.number + ".pdf");
  }

  /* ---------------------------
      FILTRES FACTURES
  ----------------------------*/
  const filteredProducts = products.filter(p =>
  p.name.toLowerCase().includes(productSearch.toLowerCase())
);
  const filteredInvoices = invoices.filter(inv =>
    inv.number?.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  /* ---------------------------
      TOTALS (jour & mois)
  ----------------------------*/
  function totals() {
    const today = new Date().toISOString().slice(0, 10);
    const month = new Date().toISOString().slice(0, 7);

    const dayTotal = invoices
      .filter((i) => i.date === today)
      .reduce(
        (s, inv) => s + inv.items.reduce((a, b) => a + (b.qty || 0) * b.price, 0),
        0
      );

    const monthTotal = invoices
      .filter((i) => i.date.slice(0, 7) === month)
      .reduce(
        (s, inv) => s + inv.items.reduce((a, b) => a + (b.qty || 0) * b.price, 0),
        0
      );

    return { dayTotal, monthTotal };
  }

  /* ============================
      PARTIE 3 — UI / RENDER & PETITS HELPERS
  ============================ */

  // --- Simple helpers ---
  function formatCurrency(n) {
    return Number(n || 0).toFixed(2);
  }

  // --- UI / RENDER ---
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <div className="flex">
        <aside className="w-72 bg-indigo-900 text-white min-h-screen p-6">
          <div className="text-2xl font-bold mb-6">MadaPerfect</div>
          <nav className="space-y-3">
            <button onClick={() => setView('dashboard')} className={`w-full text-left px-3 py-2 rounded ${view==='dashboard' ? 'bg-indigo-700' : ''}`}>Tableau de bord</button>
            <button onClick={() => setView('articles')} className={`w-full text-left px-3 py-2 rounded ${view==='articles' ? 'bg-indigo-700' : ''}`}>Articles</button>
            <button onClick={() => setView('invoices')} className={`w-full text-left px-3 py-2 rounded ${view==='invoices' ? 'bg-indigo-700' : ''}`}>Factures</button>
            <button onClick={() => setView('clients')} className={`w-full text-left px-3 py-2 rounded ${view==='clients' ? 'bg-indigo-700' : ''}`}>Clients</button>
            <button onClick={() => setView('settings')} className={`w-full text-left px-3 py-2 rounded ${view==='settings' ? 'bg-indigo-700' : ''}`}>Paramètres</button>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          {/* Header + search */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">
              {view === 'dashboard' ? 'Tableau de bord' :
               view === 'articles' ? 'Articles' :
               view === 'invoices' ? 'Factures' :
               view === 'clients' ? 'Clients' : 'Paramètres'}
            </h1>

            <div className="flex items-center gap-4">
              <input
                placeholder={view === 'invoices' ? 'Recherche numéro de facture' : 'Recherche...'}
                value={view === 'invoices' ? invoiceSearch : productSearch}
                onChange={e => view==='invoices' ? setInvoiceSearch(e.target.value) : setProductSearch(e.target.value)}
                className="px-3 py-2 rounded border"
              />
              <div className="text-sm text-gray-600">Utilisateur • Admin</div>
            </div>
          </div>

          {/* === DASHBOARD === */}
          {view === 'dashboard' && (
            <div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard title="Ventes du jour" value={`${formatCurrency(totals().dayTotal)} AR`} />
                <StatCard title="Ventes du mois" value={`${formatCurrency(totals().monthTotal)} AR`} />
                <StatCard title="Produits" value={products.length} />
                <StatCard title="Factures" value={invoices.length} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white p-4 rounded shadow">
                  <h3 className="font-semibold mb-2">Dernières factures</h3>
                  <table className="w-full text-sm">
                    <thead className="text-left text-gray-500"><tr><th>Numéro</th><th>Date</th><th>Client</th><th>Total</th></tr></thead>
                    <tbody>
                      {invoices.slice().reverse().map(inv => {
                        const total = inv.items.reduce((a,b)=>a+(b.qty||0)*(b.price||0),0);
                        const client = clients.find(c => c.id === inv.clientId);
                        return (<tr key={inv.id} className="border-t"><td className="py-2">{inv.number}</td><td>{inv.date}</td><td>{client?.name}</td><td>{formatCurrency(total)}</td></tr>);
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white p-4 rounded shadow">
                  <h3 className="font-semibold mb-2">Récapitulatif</h3>
                  <div>Produits: {products.length}</div>
                  <div>Clients: {clients.length}</div>
                  <div>Factures: {invoices.length}</div>
                </div>
              </div>
            </div>
          )}

          {/* === ARTICLES === */}
          {view === 'articles' && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-4">Liste des produits</h3>
                <div className="space-y-3">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between border rounded p-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='} alt="" className="w-14 h-14 object-cover rounded" />
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-sm">{p.description}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(p.price)}</div>
                        <div className="flex gap-2 mt-2 justify-end">
                          <button onClick={() => startEditProduct(p)} className="px-3 py-1 bg-yellow-400 rounded text-sm">Modifier</button>
                          <button onClick={() => deleteProduct(p.id)} className="px-3 py-1 bg-red-500 rounded text-sm text-white">Supprimer</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-3">Ajouter / Modifier produit</h3>
                <div className="space-y-2">
                  <input value={productForm.name} onChange={e=>setProductForm(f=>({...f, name: e.target.value}))} placeholder="Nom du produit" className="w-full px-2 py-2 border rounded" />
                  <input value={productForm.price} onChange={e=>setProductForm(f=>({...f, price: e.target.value}))} placeholder="Prix unitaire" className="w-full px-2 py-2 border rounded" />
                  <input value={productForm.link} onChange={e=>setProductForm(f=>({...f, link: e.target.value}))} placeholder="Lien du produit (optionnel)" className="w-full px-2 py-2 border rounded" />
                  <textarea value={productForm.description} onChange={e=>setProductForm(f=>({...f, description: e.target.value}))} placeholder="Description" className="w-full px-2 py-2 border rounded" />
                  <input type="file" accept="image/*" onChange={e=>handleProductImage(e.target.files[0])} />
                  <div className="flex gap-2">
                    <button onClick={saveProduct} className="px-3 py-2 bg-indigo-600 text-white rounded">{editingProduct ? 'Enregistrer' : 'Ajouter'}</button>
                    <button onClick={cancelProduct} className="px-3 py-2 border rounded">Annuler</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === CLIENTS === */}
          {view === 'clients' && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-3">Liste des clients</h3>
                <table className="w-full text-sm">
                  <thead className="text-left"><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th></th></tr></thead>
                  <tbody>
                    {clients.map(c => (
                      <tr key={c.id} className="border-t"><td className="py-2">{c.name}</td><td>{c.email}</td><td>{c.phone}</td><td><div className="flex gap-2"><button onClick={()=>editClient(c)} className="px-2 py-1 bg-yellow-400 rounded">Modifier</button><button onClick={()=>deleteClient(c.id)} className="px-2 py-1 bg-red-500 text-white rounded">Supprimer</button></div></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-3">Ajouter client</h3>
                <input value={clientForm.name} onChange={e=>setClientForm(f=>({...f, name: e.target.value}))} placeholder="Nom" className="w-full px-2 py-2 border rounded mb-2" />
                <input value={clientForm.email} onChange={e=>setClientForm(f=>({...f, email: e.target.value}))} placeholder="Email" className="w-full px-2 py-2 border rounded mb-2" />
                <input value={clientForm.phone} onChange={e=>setClientForm(f=>({...f, phone: e.target.value}))} placeholder="Téléphone" className="w-full px-2 py-2 border rounded mb-2" />
                <input value={clientForm.address || ''} onChange={e=>setClientForm(f=>({...f, address: e.target.value}))} placeholder="Adresse du client" className="w-full px-2 py-2 border rounded mb-2" />
                <div className="flex gap-2"><button onClick={saveClient} className="px-3 py-2 bg-indigo-600 text-white rounded">Enregistrer</button><button onClick={()=>setClientForm(emptyClient)} className="px-3 py-2 border rounded">Annuler</button></div>
              </div>
            </div>
          )}

          {/* === FACTURES === */}
          {view === 'invoices' && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-3">{editingInvoice ? 'Modifier facture' : 'Créer facture'}</h3>

                <label className="block">Type</label>
                <select value={invoiceDraft.type} onChange={e=>setInvoiceDraft(d=>({...d, type: e.target.value}))} className="w-full px-2 py-2 border rounded mb-2">
                  <option value="commercial">Facture Commerciale</option>
                  <option value="proforma">Facture Proforma</option>
                </select>

                <label className="block">Client</label>
                <select value={invoiceDraft.clientId||''} onChange={e=>setInvoiceDraft(d=>({...d, clientId: Number(e.target.value)}))} className="w-full px-2 py-2 border rounded mb-2">
                  <option value="">-- Choisir client --</option>
                  {clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <label className="block">Ajouter produit</label>
                <select onChange={e => { if(e.target.value) addItemToDraft(Number(e.target.value)); e.target.value=''; }} className="w-full px-2 py-2 border rounded mb-4">
                  <option value="">-- Choisir produit --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <label className="block mt-2">Date de livraison</label>
                <input type="date" value={invoiceDraft.deliveryDate || ""} onChange={e=>setInvoiceDraft(d=>({...d, deliveryDate: e.target.value}))} className="w-full px-2 py-2 border rounded mb-2" />

                <label className="block mt-2">Lieu de livraison</label>
                <input type="text" placeholder="Ex : Ambatomaro" value={invoiceDraft.deliveryAddress || ""} onChange={e=>setInvoiceDraft(d=>({...d, deliveryAddress: e.target.value}))} className="w-full px-2 py-2 border rounded mb-2" />

                <div className="border rounded p-2 mb-3">
                  {invoiceDraft.items.map(it=> (
                    <div key={it.id} className="flex items-center justify-between border-b py-2">
                      <div>
                        <div className="font-semibold">{it.name}</div>
                        <div className="text-sm">PU: {formatCurrency(it.price)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input value={it.qty} onChange={e=>updateItemQty(it.id, e.target.value)} type="number" min="1" className="w-20 px-2 py-1 border rounded" />
                        <button onClick={()=>removeItemFromDraft(it.id)} className="px-2 py-1 bg-red-500 text-white rounded">Suppr</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  {editingInvoice ? (
                    <button onClick={updateInvoice} className="px-3 py-2 bg-yellow-600 text-white rounded">Enregistrer les modifications</button>
                  ) : (
                    <button onClick={saveInvoice} className="px-3 py-2 bg-cyan-600 text-white rounded">Générer facture</button>
                  )}
                  <button onClick={()=>{ resetInvoiceDraft(); setEditingInvoice(false); }} className="px-3 py-2 border rounded">Annuler</button>
                </div>
              </div>

              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-3">Factures</h3>
                <div className="space-y-2">
                  {filteredInvoices.map(inv => {
                    const total = inv.items.reduce((a,b)=>a+(b.qty||0)*(b.price||0),0);
                    return (
                      <div key={inv.id} className="border rounded p-2 flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{inv.number}</div>
                          <div className="text-xs text-gray-500">{inv.date} • {inv.type}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{formatMG(total)}</div>
                          <button onClick={()=>generateInvoicePDF(inv)} className="px-2 py-1 bg-yellow-600 text-white rounded">PDF</button>
                          <button onClick={()=>startEditInvoice(inv)} className="px-2 py-1 bg-green-500 text-white rounded">Modifier</button>
                          <button onClick={()=>editInvoice(inv)} className="px-2 py-1 bg-red-600 text-white rounded">Paiement</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* === PARAMÈTRES === */}
          {view === 'settings' && (
            <div className="bg-white p-4 rounded shadow max-w-xl">
              <h3 className="font-semibold mb-3">Paramètres de l'entreprise</h3>
              <input value={company.name} onChange={e=>setCompany({...company, name:e.target.value})} placeholder="Nom entreprise" className="w-full px-3 py-2 border rounded mb-2" />
              <input value={company.nif} onChange={e=>setCompany({...company, nif:e.target.value})} placeholder="NIF" className="w-full px-3 py-2 border rounded mb-2" />
              <input value={company.stat} onChange={e=>setCompany({...company, stat:e.target.value})} placeholder="STAT" className="w-full px-3 py-2 border rounded mb-2" />
              <input value={company.address || ''} onChange={e=>setCompany(c=>({...c, address: e.target.value}))} placeholder="Adresse" className="w-full px-2 py-2 border rounded mb-2" />
              <input value={company.contact || ''} onChange={e=>setCompany(c=>({...c, contact: e.target.value}))} placeholder="Contact" className="w-full px-2 py-2 border rounded mb-2" />
              <label>Logo</label>
              <input type="file" onChange={e=>handleLogoUpload(e.target.files[0])} />
              {company.logo && <img src={company.logo} alt="" className="w-24 mt-2" />}
            </div>
          )}
        </main>
      </div>
    </div>
  );

} // <-- FIN de la fonction MadaPerfectApp


// -------- STAT CARD --------
function StatCard({ title, value }){
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xl font-bold mt-2">{value}</div>
    </div>
  )
}
