import React from 'react'

export const G360Signature = ({ cliente = 'CIPSA', showVersion = true, version = '1.0.0' }) => {
  return (
    <div className="g360-signature">
      <span className="g360-signature-brand">{cliente}</span>
      <span className="g360-signature-text">powered by</span>
      <span className="g360-signature-author">G360</span>
      {showVersion && (
        <>
          <span className="g360-signature-separator">•</span>
          <span className="g360-signature-version">v{version}</span>
        </>
      )}
    </div>
  )
}

export default G360Signature
