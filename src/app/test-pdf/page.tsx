'use client'

import { useState } from 'react'
import { jsPDF } from 'jspdf'

export default function TestPdfPage() {
    const [status, setStatus] = useState('Ready')

    const generatePdf = () => {
        try {
            setStatus('Generating...')
            const doc = new jsPDF()

            doc.setFontSize(20)
            doc.text('Test PDF Document', 20, 20)

            doc.setFontSize(12)
            doc.text('This is a test document to verify PDF download functionality.', 20, 40)
            doc.text(`Generated at: ${new Date().toLocaleString()}`, 20, 50)

            // Save with a simple name first
            doc.save('test-document.pdf')
            setStatus('Downloaded!')
        } catch (error) {
            console.error('PDF Generation Error:', error)
            setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    return (
        <div className="p-8 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">PDF Download Test</h1>
            <div className="p-4 border rounded-lg bg-white shadow-sm">
                <p className="mb-4 text-gray-600">Status: {status}</p>
                <button
                    onClick={generatePdf}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    Download Test PDF
                </button>
            </div>
        </div>
    )
}
