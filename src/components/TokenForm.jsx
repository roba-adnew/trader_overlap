import { useState } from "react";
import PropTypes from "prop-types";

export function TokenForm({ onSubmit }) {
    const [tokenEntries, setTokenEntries] = useState([
        { token: '', startDate: '', endDate: '' }
    ]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formattedEntries = tokenEntries.map(entry => ({
            token: entry.token.trim(),
            startTimestamp: new Date(entry.startDate).getTime(),
            endTimestamp: new Date(entry.endDate).getTime()
        }));
        onSubmit(formattedEntries);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.trim().split('\n');
            const newEntries = lines.map(line => ({
                token: line.trim(),
                startDate: '',
                endDate: ''
            }));
            setTokenEntries(newEntries);
        };
        
        reader.readAsText(file);
    };

    const addTokenEntry = () => {
        setTokenEntries([...tokenEntries, { token: '', startDate: '', endDate: '' }]);
    };

    const removeTokenEntry = (index) => {
        setTokenEntries(tokenEntries.filter((_, i) => i !== index));
    };

    const updateTokenEntry = (index, field, value) => {
        const newEntries = [...tokenEntries];
        newEntries[index] = { ...newEntries[index], [field]: value };
        setTokenEntries(newEntries);
    };

    return (
        <form onSubmit={handleSubmit} className="form">
            <div className="form-header">
                <h3>Token Entries</h3>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="file-input"
                />
            </div>

            {tokenEntries.map((entry, index) => (
                <div key={index} className="token-entry">
                    <div className="token-input">
                        <input
                            type="text"
                            value={entry.token}
                            onChange={(e) => updateTokenEntry(index, 'token', e.target.value)}
                            className="input"
                            placeholder="Token Address"
                            required
                        />
                        {tokenEntries.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeTokenEntry(index)}
                                className="remove-button"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    
                    <div className="date-inputs">
                        <input
                            type="datetime-local"
                            value={entry.startDate}
                            onChange={(e) => updateTokenEntry(index, 'startDate', e.target.value)}
                            className="input"
                            required
                        />
                        <input
                            type="datetime-local"
                            value={entry.endDate}
                            onChange={(e) => updateTokenEntry(index, 'endDate', e.target.value)}
                            className="input"
                            required
                        />
                    </div>
                </div>
            ))}

            <div className="form-actions">
                <button type="button" onClick={addTokenEntry} className="button secondary">
                    Add Token
                </button>
                <button type="submit" className="button primary">
                    Analyze Transactions
                </button>
            </div>
        </form>
    );
}

TokenForm.propTypes = {
    onSubmit: PropTypes.func.isRequired
};
