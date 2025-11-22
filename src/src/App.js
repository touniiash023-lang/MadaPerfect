
import React, { useEffect, useState } from "react";
import { FiLogOut } from "react-icons/fi";
import Login from "./Login";
import { auth } from "./firebase";
import { db } from "./firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import Dashboard from "./views/Dashboard";
import ProductsView from "./views/Products";
import ClientsView from "./views/Clients";
import InvoicesView from "./views/Invoices";
import SettingsView from "./views/Settings";

/*
  Rebuilt App.js
  - All hooks declared unconditionally at top
  - Auth listener + realtime firestore listeners
  - Simple UI switch between views
  - Designed to be a drop-in replacement for src/App.js
*/

export default function MadaPerfectApp() {
  // ---------- Auth ----------
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // ---------- App state (hooks declared at top) ----------
  const [view, setView] = useState("dashboard");

  // Products
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");

  // Clients
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState("");

  // Invoices
  const [invoices, setInvoices] = useState([]);
  const [invoiceSearch, setInvoiceSearch] = useState("");

  // UI forms (local)
  const [productForm, setProductForm] = useState({ id: null, name: "", price: 0, description: "", image: "", link: "" });
  const [clientForm, setClientForm] = useState({ id: null, name: "", email: "", phone: "", address: "" });
  const [invoiceDraft, setInvoiceDraft] = useState({ id: null, clientId: null, items: [], type: "commercial", date: new Date().toISOString().slice(0,10), paid: 0 });

  // Derived
  const isAdmin = user?.role === "admin";

  // ---------- Auth listener ----------
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) { setUser(null); setAuthReady(true); return; }
      // attempt to read custom claims if available (may require server-side setCustomClaims)
      let role = "employe";
      try {
        const token = await u.getIdTokenResult();
        role = (token?.claims?.role) || role;
      } catch (e) { /* ignore */ }
      setUser({ uid: u.uid, email: u.email, role });
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // ---------- Firestore realtime listeners ----------
  useEffect(() => {
    const col = collection(db, "articles");
    const unsub = onSnapshot(col, snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const col = collection(db, "clients");
    const unsub = onSnapshot(col, snap => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const col = collection(db, "invoices");
    const unsub = onSnapshot(col, snap => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ---------- CRUD helpers (Firestore) ----------
  async function saveProduct(p) {
    if (!p.name) return alert("Nom du produit requis");
    if (p.id) {
      await updateDoc(doc(db, "articles", p.id), p);
    } else {
      await addDoc(collection(db, "articles"), p);
    }
    setProductForm({ id: null, name: "", price: 0, description: "", image: "", link: "" });
  }

  async function deleteProduct(id) {
    if (!confirm("Supprimer produit ?")) return;
    await deleteDoc(doc(db, "articles", id));
  }

  async function saveClient(c) {
    if (!c.name) return alert("Nom requis");
    if (c.id) {
      await updateDoc(doc(db, "clients", c.id), c);
    } else {
      await addDoc(collection(db, "clients"), c);
    }
    setClientForm({ id: null, name: "", email: "", phone: "", address: "" });
  }

  async function deleteClient(id) {
    if (!confirm("Supprimer client ?")) return;
    await deleteDoc(doc(db, "clients", id));
  }

  async function saveInvoice(inv) {
    if (!inv.clientId) return alert("Sélectionner client");
    if (inv.id) {
      await updateDoc(doc(db, "invoices", inv.id), inv);
    } else {
      await addDoc(collection(db, "invoices"), inv);
    }
    setInvoiceDraft({ id: null, clientId: null, items: [], type: "commercial", date: new Date().toISOString().slice(0,10), paid: 0 });
  }

  async function deleteInvoice(id) {
    if (!confirm("Supprimer facture ?")) return;
    await deleteDoc(doc(db, "invoices", id));
  }

  function logout() {
    auth.signOut();
    setUser(null);
  }

  // ---------- Formatters ----------
  function formatCurrency(n){ return Number(n||0).toLocaleString("fr-FR"); }

  // ---------- Filters ----------
  const filteredProducts = products.filter(p => (p.name||"").toLowerCase().includes(productSearch.toLowerCase()));
  const filteredInvoices = invoices.filter(inv => (inv.number||"").toLowerCase().includes(invoiceSearch.toLowerCase()));

  // ---------- Render guards ----------
  if (!authReady) return <div>Chargement...</div>;
  if (!user) return <Login />;

  // ---------- Main render ----------
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <button onClick={logout} title="Déconnexion" className="fixed top-4 right-4 bg-white shadow p-2 rounded"><FiLogOut /></button>
      <div className="flex">
        <aside className="w-72 bg-indigo-900 text-white min-h-screen p-6">
          <div className="text-2xl font-bold mb-6">MadaPerfect</div>
          <nav className="space-y-3">
            <button onClick={()=>setView("dashboard")} className="w-full text-left px-3 py-2 rounded">Tableau de bord</button>
            <button onClick={()=>setView("articles")} className="w-full text-left px-3 py-2 rounded">Articles</button>
            <button onClick={()=>setView("invoices")} className="w-full text-left px-3 py-2 rounded">Factures</button>
            <button onClick={()=>setView("clients")} className="w-full text-left px-3 py-2 rounded">Clients</button>
            <button onClick={()=>setView("settings")} className="w-full text-left px-3 py-2 rounded">Paramètres</button>
          </nav>
          <div className="mt-6 text-sm text-indigo-200">Connecté : <strong>{user.email}</strong><div className="text-xs">Role: {user.role}</div></div>
        </aside>

        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">{view === "dashboard" ? "Tableau de bord" : view}</h1>
            <div className="flex items-center gap-4">
              <input placeholder="Recherche..." className="px-3 py-2 rounded border" onChange={(e)=>{ setProductSearch(e.target.value); setInvoiceSearch(e.target.value); setClientSearch(e.target.value); }} />
            </div>
          </div>

          {view === "dashboard" && <Dashboard totals={() => ({ dayTotal: 0, monthTotal: 0 })} products={products} invoices={invoices} clients={clients} />}

          {view === "articles" && (
            <ProductsView
              products={filteredProducts}
              productForm={productForm}
              setProductForm={setProductForm}
              saveProduct={saveProduct}
              deleteProduct={deleteProduct}
            />
          )}

          {view === "clients" && (
            <ClientsView
              clients={clients}
              clientForm={clientForm}
              setClientForm={setClientForm}
              saveClient={saveClient}
              deleteClient={deleteClient}
            />
          )}

          {view === "invoices" && (
            <InvoicesView
              invoices={filteredInvoices}
              clients={clients}
              invoiceDraft={invoiceDraft}
              setInvoiceDraft={setInvoiceDraft}
              saveInvoice={saveInvoice}
              deleteInvoice={deleteInvoice}
            />
          )}

          {view === "settings" && <SettingsView companyName="MadaPerfect" />}
        </main>
      </div>
    </div>
  );
}
