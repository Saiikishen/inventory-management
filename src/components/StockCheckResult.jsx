import React from 'react';
import Modal from 'react-modal';
import * as XLSX from 'xlsx';
import './StockCheckResult.css';

const StockCheckResult = ({
    isOpen,
    onRequestClose,
    stockCheckResult,
    isStockAvailable,
    isLoading,
    executeProductionRun,
    openForceModal,
}) => {
    if (!stockCheckResult) return null;

    const handleDownload = () => {
        const worksheet = XLSX.utils.json_to_sheet(stockCheckResult);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Check Results");
        XLSX.writeFile(workbook, "stock_check_results.xlsx");
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Stock Check Results"
            className="stock-check-modal"
            overlayClassName="stock-check-overlay"
        >
            <div className="stock-check-header">
                Stock Check Results
            </div>
            <div className="stock-check-body">
                <table className="stock-check-table">
                    <thead>
                        <tr>
                            <th>Component</th>
                            <th>Location</th>
                            <th>Required</th>
                            <th>Available</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stockCheckResult.map((item, index) => (
                            <tr key={index} className={!item.hasEnoughStock && !item.error ? 'stock-check-out-of-stock' : ''}>
                                <td>{item.name || item.componentId}</td>
                                <td>{item.locationName || '-'}</td>
                                <td>{item.requiredQuantity}</td>
                                <td>{item.availableStock}</td>
                                <td>
                                    {item.error ? <span className="stock-check-status-error">{item.error}</span> :
                                     item.hasEnoughStock ? <span className="stock-check-status-ok">In Stock</span> : <span className="stock-check-status-error">Out of Stock</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="stock-check-actions">
                {isStockAvailable && !isLoading && (
                    <button onClick={() => executeProductionRun()} className="stock-check-button execute-run-button">Execute Production Run</button>
                )}
                {!isStockAvailable && stockCheckResult.some(item => !item.hasEnoughStock) && !isLoading && (
                    <button onClick={openForceModal} className="stock-check-button force-run-button">Force Production Run</button>
                )}
                <button onClick={handleDownload} className="stock-check-button download-button">Download</button>
                <button onClick={onRequestClose} className="stock-check-button cancel-button">Close</button>
            </div>
        </Modal>
    );
};

export default StockCheckResult;
