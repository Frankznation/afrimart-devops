import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-primary-600">
              AfriMart E-Commerce
            </h1>
            <p className="text-gray-600 mt-2">
              Full-Stack Application for DevOps Training
            </p>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="card text-center">
            <h2 className="text-2xl font-semibold mb-4">
              🚀 Application Successfully Loaded!
            </h2>
            <p className="text-gray-600 mb-6">
              This is the AfriMart e-commerce platform. Complete the React frontend
              components to build the full user interface.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="card bg-primary-50">
                <h3 className="font-semibold text-lg mb-2">Backend API</h3>
                <p className="text-sm text-gray-600">
                  RESTful API with authentication, products, cart, and orders
                </p>
              </div>
              <div className="card bg-blue-50">
                <h3 className="font-semibold text-lg mb-2">Database</h3>
                <p className="text-sm text-gray-600">
                  PostgreSQL with Redis caching and Bull job queue
                </p>
              </div>
              <div className="card bg-purple-50">
                <h3 className="font-semibold text-lg mb-2">DevOps Ready</h3>
                <p className="text-sm text-gray-600">
                  Docker, monitoring, health checks, and metrics included
                </p>
              </div>
            </div>
          </div>
        </main>
        
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </Router>
  );
}

export default App;
