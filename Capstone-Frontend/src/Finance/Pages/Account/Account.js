import React, { useContext, useState } from 'react';
import './Account.css';
import Sidebar from '../../Components/Sidebar';
import Logout from '../../Components/Logout';
import { toast } from 'react-toastify';
import { UserContext } from '../../../UserContext';

export default function FinanceAccount() {
    const { finance } = useContext(UserContext);
    const [oldPw, setOldPw] = useState('');
    const [newPw, setNewPw] = useState('');

    const handleSavePassword = async () => {
        if (!oldPw || !newPw) {
            toast.warning('Please fill in both password fields.');
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/finance/update-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    old_password: oldPw,
                    new_password: newPw,
                    email: finance?.email,
                }),
            });

            if (!response.ok) {
                toast.warning('Password change failed. Check your old password.');
                return;
            }

            setOldPw('');
            setNewPw('');
            toast.success('Password changed successfully!');
        } catch (error) {
            toast.error('Something went wrong. Please try again.');
            console.error('Error updating password:', error);
        }
    };

    return (
        <div className="finance-account-container">
            <Sidebar />
            <div className="finance-account-main">
                <Logout />

                <div className="finance-account-card">
                    <h3>Account</h3>
                    <h2>{finance?.name || 'Finance Officer'}</h2>
                    <p className="finance-account-email">{finance?.email || ''}</p>

                    <div className="finance-account-divider" />

                    <h4>Change Password</h4>
                    <div className="finance-input-group">
                        <input
                            type="password"
                            placeholder="Current password"
                            value={oldPw}
                            onChange={(e) => setOldPw(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="New password"
                            value={newPw}
                            onChange={(e) => setNewPw(e.target.value)}
                        />
                        <button onClick={handleSavePassword} className="finance-save-btn">
                            Save Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}