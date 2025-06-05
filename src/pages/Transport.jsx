import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import TransportTable from '../components/TransportTable';
import AddTransportDialog from '../components/AddTransportDialog';
import EditTransportDialog from '../components/EditTransportDialog';
import ViewPassengersDialog from '../components/ViewPassengersDialog';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

function Transport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  
  // Dialog states
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, index: null, data: null });
  const [viewDialog, setViewDialog] = useState({ open: false, passengers: [] });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, index: null });

  // Fetch transports from Firebase
  useEffect(() => {
    const fetchTransports = async () => {
      try {
        const transportCollection = collection(db, 'transport');
        const transportSnapshot = await getDocs(transportCollection);
        const transportList = transportSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(transportList);
      } catch (error) {
        console.error("Error fetching transports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransports();
  }, []);

  // Add handlers
  const handleAddOpen = () => setAddDialog(true);
  const handleAddClose = () => setAddDialog(false);
  const handleAddSave = async (newTransport) => {
    try {
      const transportCollection = collection(db, 'transport');
      const docRef = await addDoc(transportCollection, {
        ...newTransport,
        createdAt: new Date(),
        passengers: []
      });
      
      setData(prev => [...prev, { id: docRef.id, ...newTransport, passengers: [] }]);
      setAddDialog(false);
    } catch (error) {
      console.error("Error adding transport:", error);
    }
  };

  // Edit handlers
  const handleEditOpen = (index) => {
    setEditDialog({ open: true, index, data: data[index] });
  };
  const handleEditClose = () => {
    setEditDialog({ open: false, index: null, data: null });
  };
  const handleEditSave = async (updatedTransport) => {
    try {
      const transportDoc = doc(db, 'transport', updatedTransport.id);
      await updateDoc(transportDoc, updatedTransport);
      
      const newData = [...data];
      newData[editDialog.index] = updatedTransport;
      setData(newData);
      handleEditClose();
    } catch (error) {
      console.error("Error updating transport:", error);
    }
  };

  // Delete handlers
  const handleDeleteOpen = (index) => {
    setDeleteDialog({ open: true, index });
  };

  const handleDeleteClose = () => {
    setDeleteDialog({ open: false, index: null });
  };

  const handleDeleteConfirm = async () => {
    try {
      const transportToDelete = data[deleteDialog.index];
      await deleteDoc(doc(db, 'transport', transportToDelete.id));
      
      const newData = data.filter((_, i) => i !== deleteDialog.index);
      setData(newData);
      handleDeleteClose();
    } catch (error) {
      console.error("Error deleting transport:", error);
    }
  };

  // View handlers
  const handleViewOpen = (passengers) => {
    setViewDialog({ open: true, passengers });
  };
  const handleViewClose = () => {
    setViewDialog({ open: false, passengers: [] });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        רשימת הסעות
      </Typography>

      <TransportTable
        data={data}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortField={sortField}
        setSortField={setSortField}
        onAddClick={handleAddOpen}
        onViewPassengers={handleViewOpen}
        onEditClick={handleEditOpen}
        onDeleteClick={handleDeleteOpen}
      />

      <AddTransportDialog
        open={addDialog}
        onClose={handleAddClose}
        onAdd={handleAddSave}
        initialData={{
          days: [],
          cities: [],
          seats: '',
          type: '',
          passengers: []
        }}
      />

      <EditTransportDialog
        open={editDialog.open}
        onClose={handleEditClose}
        onSave={handleEditSave}
        transportData={editDialog.data}
      />

      <ViewPassengersDialog
        open={viewDialog.open}
        onClose={handleViewClose}
        passengers={viewDialog.passengers}
      />

      {/* דיאלוג אישור מחיקה */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteClose}
        dir="rtl"
      >
        <DialogTitle>אישור מחיקה</DialogTitle>
        <DialogContent>
          האם אתה בטוח שברצונך למחוק את ההסעה?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>ביטול</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            מחק
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Transport;