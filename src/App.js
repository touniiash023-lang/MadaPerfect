// src/App.js
import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { FiLogOut } from "react-icons/fi";
import Login from "./Login";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function MadaPerfectApp() {
  /* ========== AUTH / ROLE ========== */
  const [logged, setLogged] = useState(
    localStorage.getItem("mp_logged") === "yes"
  );
  const [role, setRole] = useState(localStorage.getItem("mp_role") || "");
  const [userEmail, setUserEmail] = useState(localStorage.getItem("mp_email") || "");

  function onLogin(user) {
    setLogged(true);
    const r = user.role || "employee";
    setRole(r);
    setUserEmail(user.email || "");
    localStorage.setItem("mp_logged", "yes");
    localStorage.setItem("mp_role", r);
    localStorage.setItem("mp_email", user.email || "");
  }

  function logout() {
    localStorage.removeItem("mp_logged");
    localStorage.removeItem("mp_role");
    localStorage.removeItem("mp_email");
    setLogged(false);
    setRole("");
    setUserEmail("");
  }

  if (!logged) {
    return <Login onLogin={onLogin} />;
  }

  /* ========== VIEW ========== */
  const [view, setView] = useState("dashboard");

  /* ========== COMPANY/SETTINGS (sauvegarde Firestore) ========== */
  const [company, setCompany] = useState({
    name: "Mada Perfect",
    nif: "",
    stat: "",
    address: "",
    contact: "",
    logo: "",
  });

  async function loadSettings() {
    // try to get single doc settings (collection 'settings', doc id 'company')
    try {
      const q = await getDocs(collection(db, "settings"));
      // if empty, keep defaults
      if (!q.empty) {
        // we expect one doc
        const d = q.docs[0].data();
        setCompany({ ...company, ...d });
      }
    } catch (err) {
      console.error("loadSettings", err);
    }
  }

  async function saveSettings() {
    try {
      // store settings as a new doc or update existing first doc
      const q = await getDocs(collection(db, "settings"));
      if (!q.empty) {
        const id = q.docs[0].id;
        await updateDoc(doc(db, "settings", id), company);
      } else {
        await addDoc(collection(db, "settings"), company);
      }
      alert("Paramètres enregistrés.");
    } catch (err) {
      console.error(err);
      alert("Erreur d'enregistrement.");
    }
  }

  /* ========== ARTICLES (products) ========== */
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const emptyProduct = { id: null, name: "", price: "", image: "", description: "", link: "" };
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProduct, setEditingProduct] = useState(false);

  async function loadProducts() {
    try {
      const snap = await getDocs(collection(db, "articles"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(list);
    } catch (err) { console.error("loadProducts", err); }
  }

  async function saveProductFirestore() {
    if (!productForm.name) return alert("Nom requis");
    try {
      if (editingProduct && productForm.id) {
        await updateDoc(doc(db, "articles", productForm.id), {
          name: productForm.name,
          price: productForm.price,
          description: productForm.description,
          link: productForm.link,
          image: productForm.image
        });
      } else {
        await addDoc(collection(db, "articles"), {
          name: productForm.name,
          price: productForm.price,
          description: productForm.description,
          link: productForm.link,
          image: productForm.image
        });
      }
      setProductForm(emptyProduct);
      setEditingProduct(false);
      loadProducts();
    } catch (err) { console.error(err); alert("Erreur"); }
  }

  function startEditProduct(p) {
    setEditingProduct(true);
    setProductForm(p);
    setView("articles");
  }

  async function deleteProductFirestore(id) {
    if (role !== "admin") return alert("Accès refusé : employé");
    if (!confirm("Supprimer cet article ?")) return;
    try {
      await deleteDoc(doc(db, "articles", id));
      loadProducts();
    } catch (err) { console.error(err); }
  }

  function cancelProduct() {
    setProductForm(emptyProduct);
    setEditingProduct(false);
  }

  function handleProductImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setProductForm(p => ({ ...p, image: e.target.result }));
    reader.readAsDataURL(file);
  }

  /* ========== CLIENTS ========== */
  const [clients, setClients] = useState([]);
  const emptyClient = { id: null, name: "", email: "", phone: "", address: "" };
  const [clientForm, setClientForm] = useState(emptyClient);

  async function loadClients() {
    try {
      const snap = await getDocs(collection(db, "clients"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setClients(list);
    } catch (err) { console.error(err); }
  }

  async function saveClientFirestore() {
    if (!clientForm.name) return alert("Nom du client requis");
    try {
      if (clientForm.id) {
        await updateDoc(doc(db, "clients", clientForm.id), clientForm);
      } else {
        await addDoc(collection(db, "clients"), clientForm);
      }
      setClientForm(emptyClient);
      loadClients();
      setView("clients");
    } catch (err) { console.error(err); }
  }

  async function deleteClientFirestore(id) {
    if (role !== "admin") return alert("Accès refusé : employé");
    if (!confirm("Supprimer ce client ?")) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      loadClients();
    } catch (err) { console.error(err); }
  }

  function editClient(c) {
    setClientForm(c);
    setView("clients");
  }

  /* ========== INVOICES (factures) ========== */
  const [invoices, setInvoices] = useState([]);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [editingInvoice, setEditingInvoice] = useState(false);
  const [invoiceDraft, setInvoiceDraft] = useState({
    id: null,
    clientId: null,
    items: [],
    type: "commercial",
    date: new Date().toISOString().slice(0,10),
    deliveryDate: "",
    deliveryAddress: "",
    paid: 0,
    number: ""
  });

  async function loadInvoices() {
    try {
      const snap = await getDocs(collection(db, "invoices"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setInvoices(list);
    } catch (err) { console.error(err); }
  }

  function addItemToDraft(productId) {
    const prod = products.find(p => p.id === productId || String(p.id) === String(productId));
    if (!prod) return;
    setInvoiceDraft(d => ({
      ...d,
      items: [...d.items, { id: Date.now(), productId: prod.id, name: prod.name, qty: 1, price: Number(prod.price || 0) }]
    }));
  }

  function updateItemQty(itemId, qty) {
    setInvoiceDraft(d => ({ ...d, items: d.items.map(it => it.id === itemId ? { ...it, qty: Number(qty) } : it) }));
  }

  function removeItemFromDraft(itemId) {
    setInvoiceDraft(d => ({ ...d, items: d.items.filter(it => it.id !== itemId) }));
  }

  function resetInvoiceDraft() {
    setInvoiceDraft({
      id: null, clientId: null, items: [], type: "commercial",
      date: new Date().toISOString().slice(0,10), deliveryDate: "", deliveryAddress: "", paid: 0, number: ""
    });
    setEditingInvoice(false);
  }

  async function saveInvoiceFirestore() {
    if (role !== "admin") return alert("Seul l'admin peut créer une facture");
    if (!invoiceDraft.clientId) return alert("Choisir un client");
    try {
      const toSave = { ...invoiceDraft, number: invoiceDraft.number || `INV-${Date.now()}` };
      const ref = await addDoc(collection(db, "invoices"), toSave);
      await updateDoc(ref, { id: ref.id });
      loadInvoices();
      resetInvoiceDraft();
      setView("invoices");
    } catch (err) { console.error(err); }
  }

  function startEditInvoice(inv) {
    setInvoiceDraft({ ...inv });
    setEditingInvoice(true);
    setView("invoices");
  }

  async function updateInvoiceFirestore() {
    if (role !== "admin") return alert("Seul l'admin peut modifier");
    if (!invoiceDraft.id) return alert("Invoice id manquant");
    try {
      await updateDoc(doc(db, "invoices", invoiceDraft.id), invoiceDraft);
      loadInvoices(); setEditingInvoice(false); resetInvoiceDraft();
      alert("Facture mise à jour !");
    } catch (err) { console.error(err); }
  }

  async function deleteInvoiceFirestore(id) {
    if (role !== "admin") return alert("Accès refusé : employé");
    if (!confirm("Supprimer cette facture ?")) return;
    try {
      await deleteDoc(doc(db, "invoices", id));
      loadInvoices();
    } catch (err) { console.error(err); }
  }

  async function editInvoicePayment(inv) {
    if (role !== "admin") return alert("Accès refusé : employé");
    const nouveauPaiement = Number(prompt("Montant payé par le client (en Ariary) :", inv.paid || 0));
    if (isNaN(nouveauPaiement)) return alert("Montant invalide !");
    try {
      await updateDoc(doc(db, "invoices", inv.id), { paid: nouveauPaiement });
      loadInvoices();
      alert("Paiement mis à jour !");
    } catch (err) { console.error(err); }
  }

  /* ========== HELPERS ========== */
  function formatMG(num) {
    return Number(num || 0).toLocaleString("fr-FR") + " MGA";
  }
  function formatCurrency(n) { return Number(n || 0).toFixed(2); }

  function parsePrice(value) {
    if (!value) return 0;
    return Number(String(value).replace(/\D/g, "")) || 0;
  }

  function numberToWordsMG(num) {
    // simplified helper (same as before)
    const unités = ["zéro","un","deux","trois","quatre","cinq","six","sept","huit","neuf"];
    const dizaines = ["","dix","vingt","trente","quarante","cinquante","soixante"];
    if (num < 10) return unités[num];
    if (num < 70) { let d = Math.floor(num/10), u = num%10; return dizaines[d] + (u>0 ? " "+unités[u] : ""); }
    if (num < 100) return "soixante " + numberToWordsMG(num-60);
    if (num < 1000) { let c=Math.floor(num/100), r=num%100; return unités[c]+" cent "+(r>0?numberToWordsMG(r):""); }
    if (num < 1000000) { let m=Math.floor(num/1000), r=num%1000; return numberToWordsMG(m)+" mille "+(r>0?numberToWordsMG(r):""); }
    return String(num);
  }

  function generateInvoicePDF(inv) {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 40;
    const margin = 20;
    const client = clients.find(c => c.id === inv.clientId);
    if (!client) { alert("Client introuvable"); return; }

    const total = inv.items.reduce((a,b)=>a+(b.qty||0)*parsePrice(b.price), 0);
    const paid = inv.paid || 0;
    const rest = total - paid;

    doc.setFontSize(12);
    doc.text(company.name || "", margin, y); y+=16;
    doc.text(`NIF : ${company.nif}   STAT : ${company.stat}`, margin, y); y+=16;
    doc.text(`Adresse : ${company.address || ""}`, margin, y); y+=16;
    doc.text(`Contact : ${company.contact || ""}`, margin, y); y+=26;

    doc.setFontSize(16);
    doc.text(inv.type==="proforma" ? "FACTURE PROFORMA" : "FACTURE COMMERCIALE", margin, y); y+=26;

    doc.setFontSize(11);
    doc.text(`Date facture : ${inv.date}`, 10, y); doc.text(`Facture No : ${inv.number}`, 300, y); y+=16;
    doc.text(`Date livraison: ${inv.deliveryDate || "Non définie"}`, 300, y); y+=16;
    doc.text(`Lieu livraison: ${inv.deliveryAddress || "Non défini"}`, 300, y); y+=20;

    doc.setFontSize(13); doc.text("D o i t :", margin, y); y+=16;
    doc.setFontSize(12); doc.text(client.name, margin, y); y+=16; doc.text(client.address||"", margin, y); y+=16; doc.text(client.phone||"", margin, y); y+=26;

    doc.line(margin, y, 550, y); y+=14;
    doc.text("Quantité", margin, y); doc.text("Désignation", margin+80, y); doc.text("Prix unitaire", margin+260, y); doc.text("Montant Total", margin+400, y); y+=10;
    doc.line(margin, y, 550, y); y+=14;

    inv.items.forEach(item => {
      const montant = (item.qty||0)*parsePrice(item.price);
      doc.text(String(item.qty), margin, y);
      doc.text(item.name, margin+80, y);
      doc.text(formatMG(item.price), margin+260, y);
      doc.text(formatMG(montant), margin+390, y);
      y+=16;
    });

    doc.line(margin, y, 550, y); y+=20;
    doc.text("Total:", margin+320, y); doc.text(formatMG(total), margin+390, y); y+=16;
    doc.text("Payé:", margin+320, y); doc.text(formatMG(paid), margin+390, y); y+=16;
    doc.text("Reste:", margin+320, y); doc.text(formatMG(rest), margin+390, y); y+=26;

    const typeLabel = inv.type === "proforma" ? "Proforma" : "Commerciale";
    const texteFinal = "Arrêtée la présente facture " + typeLabel + " à la somme : " + numberToWordsMG(total) + " Ariary";
    doc.text(texteFinal, margin, y); y+=26; doc.text("Merci pour votre confiance.", margin, y);

    doc.save((inv.number || "invoice")+".pdf");
  }

  /* ========== FILTERS ========== */
  const filteredProducts = products.filter(p => (p.name||"").toLowerCase().includes((productSearch||"").toLowerCase()));
  const filteredInvoices = invoices.filter(inv => (inv.number||"").toLowerCase().includes((invoiceSearch||"").toLowerCase()));

  /* ========== LIFECYCLE LOAD ========== */
  useEffect(() => {
    loadProducts();
    loadClients();
    loadInvoices();
    loadSettings();
    // eslint-disable-next-line
  }, []);

  /* ========== UI ========== */
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {/* Déconnexion flottant */}
      <button
        onClick={logout}
        className="fixed top-4 right-4 bg-white shadow-lg p-3 rounded-full hover:bg-gray-100 z-50"
        title="Déconnexion"
      >
        <FiLogOut size={22} />
      </button>

      <div className="flex">
        {/* SIDEBAR */}
        <aside className="w-72 bg-indigo-900 text-white min-h-screen p-6">
          <div className="text-2xl font-bold mb-6">MadaPerfect</div>
          <nav className="space-y-3">
            <button onClick={() => setView("dashboard")} className={`w-full text-left px-3 py-2 rounded ${view==='dashboard' ? 'bg-indigo-700' : ''}`}>Tableau de bord</button>
            <button onClick={() => setView("articles")} className={`w-full text-left px-3 py-2 rounded ${view==='articles' ? 'bg-indigo-700' : ''}`}>Articles</button>
            <button onClick={() => setView("invoices")} className={`w-full text-left px-3 py-2 rounded ${view==='invoices' ? 'bg-indigo-700' : ''}`}>Factures</button>
            <button onClick={() => setView("clients")} className={`w-full text-left px-3 py-2 rounded ${view==='clients' ? 'bg-indigo-700' : ''}`}>Clients</button>
            <button onClick={() => setView("settings")} className={`w-full text-left px-3 py-2 rounded ${view==='settings' ? 'bg-indigo-700' : ''}`}>Paramètres</button>
          </nav>

          <div className="mt-6 text-sm text-indigo-100">Connecté : <strong>{role === 'admin' ? 'Admin' : 'Employé'}</strong></div>
          <div className="text-xs text-indigo-200 mt-2">{userEmail}</div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">
              {view === "dashboard" ? "Tableau de bord" :
               view === "articles" ? "Articles" :
               view === "invoices" ? "Factures" :
               view === "clients" ? "Clients" : "Paramètres"}
            </h1>

            <div className="flex items-center gap-4">
              <input
                placeholder={view === "invoices" ? "Recherche numéro de facture" : "Recherche..."}
                value={view === "invoices" ? invoiceSearch : productSearch}
                onChange={e => view === "invoices" ? setInvoiceSearch(e.target.value) : setProductSearch(e.target.value)}
                className="px-3 py-2 rounded border"
              />
              <div className="text-sm text-gray-600">Utilisateur • <strong>{role === 'admin' ? 'Admin' : 'Employé'}</strong></div>
            </div>
          </div>

          {/* Dashboard */}
          {view === "dashboard" && (
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
                        return (
                          <tr key={inv.id} className="border-t">
                            <td className="py-2">{inv.number}</td>
                            <td>{inv.date}</td>
                            <td>{client?.name}</td>
                            <td>{formatCurrency(total)}</td>
                          </tr>
                        );
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

          {/* Articles */}
          {view === "articles" && (
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
                          {role === "admin" && <button onClick={() => startEditProduct(p)} className="px-3 py-1 bg-yellow-400 rounded text-sm">Modifier</button>}
                          {role === "admin" && <button onClick={() => deleteProductFirestore(p.id)} className="px-3 py-1 bg-red-500 rounded text-sm text-white">Supprimer</button>}
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
                    {role === "admin" ? (
                      <button onClick={saveProductFirestore} className="px-3 py-2 bg-indigo-600 text-white rounded">{editingProduct ? 'Enregistrer' : 'Ajouter'}</button>
                    ) : (
                      <div className="text-gray-500">Lecture seule (employé)</div>
                    )}
                    <button onClick={cancelProduct} className="px-3 py-2 border rounded">Annuler</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clients */}
          {view === "clients" && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-3">Liste des clients</h3>
                <table className="w-full text-sm">
                  <thead className="text-left"><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th></th></tr></thead>
                  <tbody>
                    {clients.map(c => (
                      <tr key={c.id} className="border-t">
                        <td className="py-2">{c.name}</td>
                        <td>{c.email}</td>
                        <td>{c.phone}</td>
                        <td>
                          <div className="flex gap-2">
                            {role === "admin" && <button onClick={() => { setClientForm(c); setView('clients'); }} className="px-2 py-1 bg-yellow-400 rounded">Modifier</button>}
                            {role === "admin" && <button onClick={() => deleteClientFirestore(c.id)} className="px-2 py-1 bg-red-500 text-white rounded">Supprimer</button>}
                          </div>
                        </td>
                      </tr>
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
                <div className="flex gap-2">
                  {role === "admin" ? (
                    <button onClick={saveClientFirestore} className="px-3 py-2 bg-indigo-600 text-white rounded">Enregistrer</button>
                  ) : (
                    <div className="text-gray-500">Lecture seule (employé)</div>
                  )}
                  <button onClick={()=> setClientForm(emptyClient)} className="px-3 py-2 border rounded">Annuler</button>
                </div>
              </div>
            </div>
          )}

          {/* Factures */}
          {view === "invoices" && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-3">{editingInvoice ? 'Modifier facture' : 'Créer facture'}</h3>

                <label className="block">Type</label>
                <select value={invoiceDraft.type} onChange={e=>setInvoiceDraft(d=>({...d, type: e.target.value}))} className="w-full px-2 py-2 border rounded mb-2">
                  <option value="commercial">Facture Commerciale</option>
                  <option value="proforma">Facture Proforma</option>
                </select>

                <label className="block">Client</label>
                <select value={invoiceDraft.clientId||''} onChange={e=>setInvoiceDraft(d=>({...d, clientId: e.target.value}))} className="w-full px-2 py-2 border rounded mb-2">
                  <option value="">-- Choisir client --</option>
                  {clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <label className="block">Ajouter produit</label>
                <select onChange={e => { if(e.target.value) addItemToDraft(e.target.value); e.target.value=''; }} className="w-full px-2 py-2 border rounded mb-4">
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
                    role === "admin" ? <button onClick={updateInvoiceFirestore} className="px-3 py-2 bg-yellow-600 text-white rounded">Enregistrer les modifications</button> : <div className="text-gray-500">Lecture seule (employé)</div>
                  ) : (
                    role === "admin" ? <button onClick={saveInvoiceFirestore} className="px-3 py-2 bg-cyan-600 text-white rounded">Générer facture</button> : <div className="text-gray-500">Lecture seule (employé)</div>
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
                          {role === "admin" && <button onClick={()=>startEditInvoice(inv)} className="px-2 py-1 bg-green-500 text-white rounded">Modifier</button>}
                          {role === "admin" && <button onClick={()=>editInvoicePayment(inv)} className="px-2 py-1 bg-red-600 text-white rounded">Paiement</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          {view === "settings" && (
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
              <div className="mt-3">
                <button onClick={saveSettings} className="px-3 py-2 bg-indigo-600 text-white rounded">Enregistrer paramètres</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );

  /* ========== helpers below UI ========== */

  function totals() {
    const today = new Date().toISOString().slice(0,10);
    const month = new Date().toISOString().slice(0,7);
    const dayTotal = invoices.filter(i => i.date === today).reduce((s, inv) => s + inv.items.reduce((a,b)=>a+(b.qty||0)*(b.price||0),0), 0);
    const monthTotal = invoices.filter(i => i.date && i.date.slice(0,7) === month).reduce((s, inv) => s + inv.items.reduce((a,b)=>a+(b.qty||0)*(b.price||0),0), 0);
    return { dayTotal, monthTotal };
  }

  function handleLogoUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setCompany(c => ({ ...c, logo: e.target.result }));
    reader.readAsDataURL(file);
  }
}

// small stat card component
function StatCard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xl font-bold mt-2">{value}</div>
    </div>
  );
}
