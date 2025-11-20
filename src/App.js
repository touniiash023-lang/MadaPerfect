// ================= PARTIE 1 =================
// src/App.js (PARTIE 1)
import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { FiLogOut } from "react-icons/fi";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  query,
  where
} from "firebase/firestore";
import { db } from "./firebase";
import Login from "./Login";

// Main export
export default function MadaPerfectApp() {

  // -----------------------
  // AUTH (Login 1 - simple)
  // -----------------------
  const [logged, setLogged] = useState(localStorage.getItem("mp_logged") === "yes");
  function logout() {
    localStorage.removeItem("mp_logged");
    setLogged(false);
  }

  // If not logged, render Login component immediately
  if (!logged) {
    return <Login onLogin={() => setLogged(true)} />;
  }

  // -------------
  // VIEW
  // -------------
  const [view, setView] = useState("dashboard");

  // -------------
  // COMPANY (store in Firestore in collection 'config' doc id 'company')
  // -------------
  const [company, setCompany] = useState({
    id: null,
    name: "Mada Perfect",
    nif: "",
    stat: "",
    address: "",
    contact: "",
    logo: ""
  });

  async function loadCompany() {
    try {
      // We expect a doc with id 'company' inside collection 'config'
      const docRef = doc(db, "config", "company");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setCompany({ id: snap.id, ...(snap.data() || {}) });
      } else {
        // set default doc if not exist
        await setDoc(docRef, {
          name: "Mada Perfect",
          nif: "",
          stat: "",
          address: "",
          contact: "",
          logo: ""
        });
        const s2 = await getDoc(docRef);
        setCompany({ id: s2.id, ...(s2.data() || {}) });
      }
    } catch (err) {
      console.error("loadCompany error", err);
    }
  }

  async function saveCompanyFirestore(updated) {
    try {
      const docRef = doc(db, "config", "company");
      await setDoc(docRef, { ...(updated || company) }, { merge: true });
      await loadCompany();
      alert("Paramètres sauvegardés.");
    } catch (err) {
      console.error("saveCompanyFirestore", err);
      alert("Erreur sauvegarde company");
    }
  }

  function handleLogoUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setCompany(c => ({ ...c, logo: e.target.result }));
    reader.readAsDataURL(file);
  }

  // -------------
  // PRODUCTS / ARTICLES (Firestore 'articles')
  // -------------
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [productForm, setProductForm] = useState({
    id: null,
    name: "",
    price: "",
    image: "",
    description: "",
    link: ""
  });
  const [editingProduct, setEditingProduct] = useState(false);

  async function loadProducts() {
    try {
      const snap = await getDocs(collection(db, "articles"));
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("loadProducts", err);
    }
  }

  async function saveProductFirestore() {
    if (!productForm.name) return alert("Nom requis");
    try {
      if (editingProduct && productForm.id) {
        await updateDoc(doc(db, "articles", productForm.id), {
          name: productForm.name,
          price: productForm.price,
          image: productForm.image,
          description: productForm.description,
          link: productForm.link
        });
      } else {
        const ref = await addDoc(collection(db, "articles"), {
          name: productForm.name,
          price: productForm.price,
          image: productForm.image,
          description: productForm.description,
          link: productForm.link
        });
        // optionally set id inside doc
        await updateDoc(doc(db, "articles", ref.id), { id: ref.id });
      }
      setProductForm({ id: null, name: "", price: "", image: "", description: "", link: "" });
      setEditingProduct(false);
      await loadProducts();
    } catch (err) {
      console.error("saveProductFirestore", err);
      alert("Erreur sauvegarde article");
    }
  }

  function startEditProduct(p) {
    setEditingProduct(true);
    setProductForm(p);
    setView("articles");
  }

  async function deleteProductFirestore(id) {
    if (!confirm("Supprimer cet article ?")) return;
    try {
      await deleteDoc(doc(db, "articles", id));
      await loadProducts();
    } catch (err) {
      console.error("deleteProductFirestore", err);
    }
  }

  function handleProductImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setProductForm(p => ({ ...p, image: e.target.result }));
    reader.readAsDataURL(file);
  }

  // -------------
  // CLIENTS (Firestore 'clients')
  // -------------
  const [clients, setClients] = useState([]);
  const [clientForm, setClientForm] = useState({ id: null, name: "", email: "", phone: "", address: "" });

  async function loadClients() {
    try {
      const snap = await getDocs(collection(db, "clients"));
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("loadClients", err);
    }
  }

  async function saveClientFirestore() {
    if (!clientForm.name) return alert("Nom du client requis");
    try {
      if (clientForm.id) {
        await updateDoc(doc(db, "clients", clientForm.id), {
          name: clientForm.name,
          email: clientForm.email,
          phone: clientForm.phone,
          address: clientForm.address
        });
      } else {
        const r = await addDoc(collection(db, "clients"), {
          name: clientForm.name,
          email: clientForm.email,
          phone: clientForm.phone,
          address: clientForm.address
        });
        await updateDoc(doc(db, "clients", r.id), { id: r.id });
      }
      setClientForm({ id: null, name: "", email: "", phone: "", address: "" });
      await loadClients();
    } catch (err) {
      console.error("saveClientFirestore", err);
      alert("Erreur sauvegarde client");
    }
  }

  async function deleteClientFirestore(id) {
    if (!confirm("Supprimer ce client ?")) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      await loadClients();
    } catch (err) {
      console.error("deleteClientFirestore", err);
    }
  }

  // Initial load for company, products, clients done below (after PARTIE 2)
// ================= PARTIE 2 =================
// src/App.js (PARTIE 2 continued inside same file)

  // -------------
  // INVOICES (Firestore 'invoices')
  // -------------
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
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("loadInvoices", err);
    }
  }

  async function saveInvoiceFirestore() {
    if (!invoiceDraft.clientId) return alert("Sélectionner un client");
    try {
      const invToSave = {
        ...invoiceDraft,
        number: invoiceDraft.number || `INV-${Date.now()}`,
        date: invoiceDraft.date || new Date().toISOString().slice(0,10)
      };
      const ref = await addDoc(collection(db, "invoices"), invToSave);
      await updateDoc(doc(db, "invoices", ref.id), { id: ref.id });
      await loadInvoices();
      resetInvoiceDraft();
      setView("invoices");
    } catch (err) {
      console.error("saveInvoiceFirestore", err);
      alert("Erreur sauvegarde facture");
    }
  }

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
      number: inv.number || ""
    });
    setEditingInvoice(true);
    setView("invoices");
  }

  async function updateInvoiceFirestore() {
    if (!invoiceDraft.id) return alert("Invoice id manquant");
    try {
      await updateDoc(doc(db, "invoices", invoiceDraft.id), { ...invoiceDraft });
      alert("Facture mise à jour !");
      setEditingInvoice(false);
      await loadInvoices();
      resetInvoiceDraft();
    } catch (err) {
      console.error("updateInvoiceFirestore", err);
      alert("Erreur update facture");
    }
  }

  async function deleteInvoiceFirestore(id) {
    if (!confirm("Supprimer cette facture ?")) return;
    try {
      await deleteDoc(doc(db, "invoices", id));
      await loadInvoices();
    } catch (err) {
      console.error("deleteInvoiceFirestore", err);
    }
  }

  async function editInvoicePayment(inv) {
    const nouveauPaiement = Number(prompt("Montant payé par le client (en Ariary) :", inv.paid || 0));
    if (isNaN(nouveauPaiement)) return alert("Montant invalide !");
    try {
      await updateDoc(doc(db, "invoices", inv.id), { paid: nouveauPaiement });
      await loadInvoices();
      alert("Paiement mis à jour !");
    } catch (err) {
      console.error("editInvoicePayment", err);
    }
  }

  function addItemToDraft(productId) {
    const prod = products.find(p => String(p.id) === String(productId));
    if (!prod) return;
    setInvoiceDraft(d => ({ ...d, items: [...d.items, { id: Date.now(), productId: prod.id, name: prod.name, qty: 1, price: Number(prod.price || 0) }] }));
  }
  function updateItemQty(itemId, qty){ setInvoiceDraft(d=>({...d, items:d.items.map(it=> it.id===itemId ? {...it, qty: Number(qty)} : it)})); }
  function removeItemFromDraft(itemId){ setInvoiceDraft(d=>({...d, items: d.items.filter(it=>it.id !== itemId)})); }
  function resetInvoiceDraft(){ setInvoiceDraft({ id:null, clientId:null, items:[], type:"commercial", date: new Date().toISOString().slice(0,10), deliveryDate:"", deliveryAddress:"", paid:0, number:"" }); }

  // -------------
  // HELPERS: formatting, totals, numberToWords
  // -------------
  function formatMG(n){ return Number(n || 0).toLocaleString("fr-FR") + " MGA"; }
  function formatCurrency(n){ return Number(n || 0).toFixed(2); }

  function numberToWordsMG(num) {
    // small french words conversion for Ariary (basic, up to millions)
    const unités = ["zéro","un","deux","trois","quatre","cinq","six","sept","huit","neuf"];
    const dizaines = ["","dix","vingt","trente","quarante","cinquante","soixante"];
    if (num === 0) return "zéro";
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
      return (c > 1 ? unités[c] + " " : "") + "cent" + (r > 0 ? " " + numberToWordsMG(r) : "");
    }
    if (num < 1000000) {
      let m = Math.floor(num / 1000);
      let r = num % 1000;
      return numberToWordsMG(m) + " mille" + (r > 0 ? " " + numberToWordsMG(r) : "");
    }
    return String(num);
  }

  function totals() {
    const today = new Date().toISOString().slice(0,10);
    const month = new Date().toISOString().slice(0,7);
    const dayTotal = invoices.filter(i => i.date === today).reduce((s,inv)=> s + (inv.items || []).reduce((a,b)=> a + (b.qty||0)*(b.price||0),0), 0);
    const monthTotal = invoices.filter(i => i.date && i.date.slice(0,7) === month).reduce((s,inv)=> s + (inv.items || []).reduce((a,b)=> a + (b.qty||0)*(b.price||0),0), 0);
    return { dayTotal, monthTotal };
  }

  // -------------
  // PDF generation (invoice) — builds PDF via jsPDF
  // -------------
  function parsePrice(value) {
    if (!value) return 0;
    return Number(String(value).replace(/\D/g,"")) || 0;
  }

  function generateInvoicePDF(inv) {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      let y = 40; const margin = 20;
      const client = clients.find(c => c.id === inv.clientId);
      if (!client) { alert("Client introuvable !"); return; }

      const total = (inv.items || []).reduce((a,b)=> a + (b.qty||0) * parsePrice(b.price), 0);
      const paid = inv.paid || 0;
      const rest = total - paid;

      // Header company
      doc.setFontSize(12);
      doc.text(company.name || "", margin, y); y += 16;
      doc.text(`NIF : ${company.nif}   STAT : ${company.stat}`, margin, y); y += 16;
      doc.text(`Adresse : ${company.address || ""}`, margin, y); y += 16;
      doc.text(`Contact : ${company.contact || ""}`, margin, y); y += 26;

      // Title
      doc.setFontSize(16);
      doc.text(inv.type === "proforma" ? "FACTURE PROFORMA" : "FACTURE COMMERCIALE", margin, y); y += 26;

      // Invoice + delivery info two-column
      doc.setFontSize(11);
      const leftX = 10, rightX = 300;
      doc.text(`Date facture : ${inv.date}`, leftX, y);
      doc.text(`Facture No : ${inv.number}`, rightX, y); y += 16;
      doc.text(`Date de livraison : ${inv.deliveryDate || "Non définie"}`, rightX, y); y += 16;
      doc.text(`Lieu de livraison : ${inv.deliveryAddress || "Non défini"}`, rightX, y); y += 20;

      // Client block
      doc.setFontSize(13);
      doc.text("D o i t :", margin, y); y += 16;
      doc.setFontSize(12);
      doc.text(client.name || "", margin, y); y += 16;
      doc.text(client.address || "", margin, y); y += 16;
      doc.text(client.phone || "", margin, y); y += 26;

      // Table header
      doc.line(margin, y, 550, y); y += 14;
      doc.text("Quantité", margin, y);
      doc.text("Désignation", margin + 80, y);
      doc.text("Prix unitaire", margin + 260, y);
      doc.text("Montant Total", margin + 400, y); y += 10;
      doc.line(margin, y, 550, y); y += 14;

      // Items
      (inv.items || []).forEach(item => {
        const montant = (item.qty || 0) * parsePrice(item.price);
        doc.text(String(item.qty), margin, y);
        doc.text(item.name || "", margin + 80, y);
        doc.text(formatMG(item.price), margin + 260, y);
        doc.text(formatMG(montant), margin + 390, y);
        y += 16;
      });

      doc.line(margin, y, 550, y); y += 20;
      doc.text("Total", margin + 320, y);
      doc.text(formatMG(total), margin + 390, y); y += 16;
      doc.text("Payé", margin + 320, y);
      doc.text(formatMG(paid), margin + 390, y); y += 16;
      doc.text("Reste", margin + 320, y);
      doc.text(formatMG(rest), margin + 390, y); y += 26;

      const typeLabel = inv.type === "proforma" ? "Proforma" : "Commerciale";
      const texteFinal = "Arrêtée la présente facture " + typeLabel + " à la somme : " + numberToWordsMG(total) + " Ariary";
      doc.text(texteFinal, margin, y); y += 26;

      doc.text("Merci pour votre confiance.", margin, y);
      doc.save((inv.number || "invoice") + ".pdf");
    } catch (err) {
      console.error("generateInvoicePDF", err);
      alert("Erreur génération PDF");
    }
  }

  // ---------------------
  // EFFECTS : LOAD initial data
  // ---------------------
  useEffect(() => {
    // load everything initially
    (async () => {
      await loadCompany();
      await loadProducts();
      await loadClients();
      await loadInvoices();
    })();
  }, []);
// ================= PARTIE 3 =================
// src/App.js (PARTIE 3 - render and small helpers)

  // Filters for UI
  const filteredProducts = products.filter(p => (p.name || "").toLowerCase().includes((productSearch || "").toLowerCase()));
  const filteredInvoices = invoices.filter(inv => (inv.number || "").toLowerCase().includes((invoiceSearch || "").toLowerCase()));

  // -----------------
  // RENDER UI
  // -----------------
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      {/* Bouton déconnexion flottant en haut à droite */}
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
            <button onClick={() => setView('dashboard')} className={`w-full text-left px-3 py-2 rounded ${view==='dashboard' ? 'bg-indigo-700' : ''}`}>Tableau de bord</button>
            <button onClick={() => setView('articles')} className={`w-full text-left px-3 py-2 rounded ${view==='articles' ? 'bg-indigo-700' : ''}`}>Articles</button>
            <button onClick={() => setView('invoices')} className={`w-full text-left px-3 py-2 rounded ${view==='invoices' ? 'bg-indigo-700' : ''}`}>Factures</button>
            <button onClick={() => setView('clients')} className={`w-full text-left px-3 py-2 rounded ${view==='clients' ? 'bg-indigo-700' : ''}`}>Clients</button>
            <button onClick={() => setView('settings')} className={`w-full text-left px-3 py-2 rounded ${view==='settings' ? 'bg-indigo-700' : ''}`}>Paramètres</button>
          </nav>

          <div className="mt-6 text-sm text-indigo-100">Connecté : <strong>Admin</strong></div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">
              {view === 'dashboard' ? 'Tableau de bord' : view === 'articles' ? 'Articles' : view === 'invoices' ? 'Factures' : view === 'clients' ? 'Clients' : 'Paramètres'}
            </h1>

            <div className="flex items-center gap-4">
              <input
                placeholder={view === 'invoices' ? 'Recherche numéro de facture' : 'Recherche...'}
                value={view === 'invoices' ? invoiceSearch : productSearch}
                onChange={e => view==='invoices' ? setInvoiceSearch(e.target.value) : setProductSearch(e.target.value)}
                className="px-3 py-2 rounded border"
              />
              <div className="text-sm text-gray-600">Utilisateur • <strong>Admin</strong></div>
            </div>
          </div>

          {/* DASHBOARD */}
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
                        const total = (inv.items || []).reduce((a,b)=>a+(b.qty||0)*(b.price||0),0);
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

          {/* ARTICLES */}
          {view === 'articles' && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white p-4 rounded shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Liste des articles</h3>
                </div>

                <div className="space-y-3">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="flex items-center justify-between border rounded p-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='} alt="" className="w-14 h-14 object-cover rounded" />
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-sm">{p.description}</div>
                          {p.link && <a className="text-xs text-indigo-600" href={p.link} target="_blank" rel="noreferrer">Voir le produit</a>}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold">{formatMG(p.price)}</div>
                        <div className="flex gap-2 mt-2 justify-end">
                          <button onClick={() => startEditProduct(p)} className="px-3 py-1 bg-yellow-400 rounded text-sm">Modifier</button>
                          <button onClick={() => deleteProductFirestore(p.id)} className="px-3 py-1 bg-red-500 rounded text-sm text-white">Supprimer</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-3">Ajouter / Modifier article</h3>
                <div className="space-y-2">
                  <input value={productForm.name} onChange={e=>setProductForm(f=>({...f, name: e.target.value}))} placeholder="Nom du produit" className="w-full px-2 py-2 border rounded" />
                  <input value={productForm.price} onChange={e=>setProductForm(f=>({...f, price: e.target.value}))} placeholder="Prix unitaire" className="w-full px-2 py-2 border rounded" />
                  <input value={productForm.link} onChange={e=>setProductForm(f=>({...f, link: e.target.value}))} placeholder="Lien du produit (optionnel)" className="w-full px-2 py-2 border rounded" />
                  <textarea value={productForm.description} onChange={e=>setProductForm(f=>({...f, description: e.target.value}))} placeholder="Description" className="w-full px-2 py-2 border rounded" />
                  <input type="file" accept="image/*" onChange={e=>handleProductImage(e.target.files[0])} />
                  <div className="flex gap-2">
                    <button onClick={saveProductFirestore} className="px-3 py-2 bg-indigo-600 text-white rounded">{editingProduct ? 'Enregistrer' : 'Ajouter'}</button>
                    <button onClick={() => { setProductForm({ id:null, name:'', price:'', image:'', description:'', link:'' }); setEditingProduct(false); }} className="px-3 py-2 border rounded">Annuler</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CLIENTS */}
          {view === 'clients' && (
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
                            <button onClick={() => { setClientForm(c); setView('clients'); }} className="px-2 py-1 bg-yellow-400 rounded">Modifier</button>
                            <button onClick={() => deleteClientFirestore(c.id)} className="px-2 py-1 bg-red-500 text-white rounded">Supprimer</button>
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
                  <button onClick={saveClientFirestore} className="px-3 py-2 bg-indigo-600 text-white rounded">Enregistrer</button>
                  <button onClick={()=> setClientForm({ id:null, name:'', email:'', phone:'', address:'' })} className="px-3 py-2 border rounded">Annuler</button>
                </div>
              </div>
            </div>
          )}

          {/* INVOICES */}
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
                <select value={invoiceDraft.clientId || ''} onChange={e=>setInvoiceDraft(d=>({...d, clientId: e.target.value || null}))} className="w-full px-2 py-2 border rounded mb-2">
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
                  {invoiceDraft.items.map(it => (
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
                    <button onClick={updateInvoiceFirestore} className="px-3 py-2 bg-yellow-600 text-white rounded">Enregistrer les modifications</button>
                  ) : (
                    <button onClick={saveInvoiceFirestore} className="px-3 py-2 bg-cyan-600 text-white rounded">Générer facture</button>
                  )}
                  <button onClick={()=>{ resetInvoiceDraft(); setEditingInvoice(false); }} className="px-3 py-2 border rounded">Annuler</button>
                </div>
              </div>

              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-3">Factures</h3>
                <div className="space-y-2">
                  {filteredInvoices.map(inv => {
                    const total = (inv.items || []).reduce((a,b)=>a+(b.qty||0)*(b.price||0),0);
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
                          <button onClick={()=>editInvoicePayment(inv)} className="px-2 py-1 bg-red-600 text-white rounded">Paiement</button>
                          <button onClick={()=>deleteInvoiceFirestore(inv.id)} className="px-2 py-1 bg-gray-300 text-black rounded">Suppr</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {view === 'settings' && (
            <div className="bg-white p-4 rounded shadow max-w-xl">
              <h3 className="font-semibold mb-3">Paramètres de l'entreprise</h3>
              <input value={company.name || ''} onChange={e=>setCompany(c=>({...c, name:e.target.value}))} placeholder="Nom entreprise" className="w-full px-3 py-2 border rounded mb-2" />
              <input value={company.nif || ''} onChange={e=>setCompany(c=>({...c, nif:e.target.value}))} placeholder="NIF" className="w-full px-3 py-2 border rounded mb-2" />
              <input value={company.stat || ''} onChange={e=>setCompany(c=>({...c, stat:e.target.value}))} placeholder="STAT" className="w-full px-3 py-2 border rounded mb-2" />
              <input value={company.address || ''} onChange={e=>setCompany(c=>({...c, address:e.target.value}))} placeholder="Adresse" className="w-full px-2 py-2 border rounded mb-2" />
              <input value={company.contact || ''} onChange={e=>setCompany(c=>({...c, contact:e.target.value}))} placeholder="Contact" className="w-full px-2 py-2 border rounded mb-2" />
              <div className="mb-3">
                <label className="block mb-1">Logo</label>
                <input type="file" accept="image/*" onChange={e=>handleLogoUpload(e.target.files[0])} />
                {company.logo && <img src={company.logo} alt="logo" className="w-32 mt-2" />}
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveCompanyFirestore()} className="px-3 py-2 bg-indigo-600 text-white rounded">Sauvegarder</button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
} // end of MadaPerfectApp

// -----------------
// StatCard helper
// -----------------
function StatCard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xl font-bold mt-2">{value}</div>
    </div>
  );
}
