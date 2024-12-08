import { useState } from "react";
import { TokenForm } from "./components/TokenForm";
import { TransactionTable } from "./components/TransactionTable";
import { processTransactions } from "./utils/solanaUtils";
import "./App.css";

function App() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleFormSubmit = async (tokenEntries) => {
        setLoading(true);
        try {
            const results = await processTransactions(tokenEntries);
            setTransactions(results);
        } catch (error) {
            console.error('Error processing transactions:', error);
            alert('Error processing transactions. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="container">
            <h1 className="title">Solana Token Trading Analysis</h1>
            <TokenForm onSubmit={handleFormSubmit} />
            {loading ? (
                <div className="loading-spinner"></div>
            ) : (
                transactions.length > 0 && (
                    <TransactionTable transactions={transactions} />
                )
            )}
        </div>
    );
}

export default App;
