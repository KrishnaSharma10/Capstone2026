import React, { useContext, useState } from 'react';
import './Account.css';

import Sidebar from '../../Components/Sidebar';
import Logout from '../../Components/Logout';
import { toast } from 'react-toastify';
import { UserContext } from '../../../UserContext';



const notifySuccessPassword = () => {
    toast.success('Successfully Password Changed!!', {
        position: 'top-right',
        autoClose: 4000,
    });
};

const notifyFailurePassword = () => {
    toast.warning('Password Change Failed!!', {
        position: 'top-right',
        autoClose: 4000,
    });
};

export default function Account() {

    const {coordinator} = useContext(UserContext);
// const [nameDraft, setNameDraft] = useState('');
const [oldPw, setOldPw] = useState('');
const [newPw, setNewPw] = useState('');

    // const handleSaveName = async () => {
    //     if (nameDraft.trim()) {
    //         try {
    //             const response = await fetch(`${process.env.REACT_APP_API_URL}/api/coordinator/update-name`, {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 },
    //                 body: JSON.stringify({ doaa_name: nameDraft.trim() })
    //             });

    //             if (!response.ok)
    //                 {
    //                     notifyFailureName();
    //                     throw new Error('Failed to update name');
    //                 }

    //             setDisplayName(nameDraft.trim());
    //             setNameDraft('');
    //             notifySuccessName();
    //         } catch (error) {
    //             notifyFailureName();
    //             console.error('Error updating name:', error);
    //         }
    //     }
    // };

    const handleSavePassword = async () => {
        if (oldPw && newPw) {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/coordinator/update-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ old_password: oldPw, new_password: newPw, email: coordinator.email })
                });

                if (!response.ok)
                    {
                        console.log(response);
                        notifyFailurePassword();
                        throw new Error('Failed to update password');
                    }

                setOldPw('');
                setNewPw('');
                notifySuccessPassword();
            } catch (error) {
                notifyFailurePassword();
                console.error('Error updating password:', error);
            }
        }
    };

return (
<div className="coordinator-account-container">
    <Sidebar />

        <div className="coordinator-account-main">
        <Logout />

            <div className="coordinator-account-details">
            <h3>Welcome!</h3>
            <h2>{coordinator?.name || "Loading"}</h2>
            <br />

            {/* <h3>Name</h3>
                <div className="coordinator-input-row">
                <input type="text" placeholder="Enter new name" value={nameDraft} onChange={e=>
                setNameDraft(e.target.value)}
                />
                <button onClick={handleSaveName}>Save </button>
            </div>

            <br /> */}

            <h3>Password</h3>
                <div className="coordinator-input-row">
                <input type="password" placeholder="Old password" value={oldPw} onChange={e=> setOldPw(e.target.value)}
                />
                <input type="password" placeholder="New password" value={newPw} onChange={e=> setNewPw(e.target.value)}
                />
                <button onClick={handleSavePassword}>Save</button>
            </div>
        </div>
    </div>
</div>
);
}