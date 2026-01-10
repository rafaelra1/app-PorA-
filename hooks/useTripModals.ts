import { useState, useCallback } from 'react';
import { City, Attraction, HotelReservation, Transport } from '../types';

export interface ModalStates {
  isAddCityModalOpen: boolean;
  isEditCityModalOpen: boolean;
  isAddAttractionModalOpen: boolean;
  isAttractionDetailModalOpen: boolean;
  isMapModalOpen: boolean;
  isAddDocumentModalOpen: boolean;
  isAddExpenseModalOpen: boolean;
  isShareModalOpen: boolean;
  isAddAccommodationModalOpen: boolean;
  isEditAccommodationModalOpen: boolean;
  isAddTransportModalOpen: boolean;
  isEditTransportModalOpen: boolean;
  isAddActivityModalOpen: boolean;
  isImageEditorModalOpen: boolean;
}

export interface ModalData {
  editingCity: City | null;
  selectedAttraction: Attraction | null;
  editingAccommodation: HotelReservation | null;
  editingTransport: Transport | null;
  selectedActivityDay: { day: number; date: string } | null;
  deletingAccommodationId: string | null;
  deletingTransportId: string | null;
}

export interface UseTripModalsReturn {
  // States
  modals: ModalStates;
  modalData: ModalData;

  // City modals
  openAddCityModal: () => void;
  openEditCityModal: (city: City) => void;
  closeAddCityModal: () => void;
  closeEditCityModal: () => void;

  // Attraction modals
  openAddAttractionModal: () => void;
  openAttractionDetailModal: (attraction: Attraction) => void;
  openMapModal: () => void;
  closeAddAttractionModal: () => void;
  closeAttractionDetailModal: () => void;
  closeMapModal: () => void;

  // Document modal
  openAddDocumentModal: () => void;
  closeAddDocumentModal: () => void;

  // Expense modal
  openAddExpenseModal: () => void;
  closeAddExpenseModal: () => void;

  // Share modal
  openShareModal: () => void;
  closeShareModal: () => void;

  // Accommodation modals
  openAddAccommodationModal: () => void;
  openEditAccommodationModal: (accommodation: HotelReservation) => void;
  closeAddAccommodationModal: () => void;
  closeEditAccommodationModal: () => void;
  setDeletingAccommodationId: (id: string | null) => void;

  // Transport modals
  openAddTransportModal: () => void;
  openEditTransportModal: (transport: Transport) => void;
  closeAddTransportModal: () => void;
  closeEditTransportModal: () => void;
  setDeletingTransportId: (id: string | null) => void;

  // Activity modal
  openAddActivityModal: (day: number, date: string) => void;
  closeAddActivityModal: () => void;

  // Image editor modal
  openImageEditorModal: () => void;
  closeImageEditorModal: () => void;
}

export const useTripModals = (): UseTripModalsReturn => {
  // Modal states
  const [modals, setModals] = useState<ModalStates>({
    isAddCityModalOpen: false,
    isEditCityModalOpen: false,
    isAddAttractionModalOpen: false,
    isAttractionDetailModalOpen: false,
    isMapModalOpen: false,
    isAddDocumentModalOpen: false,
    isAddExpenseModalOpen: false,
    isShareModalOpen: false,
    isAddAccommodationModalOpen: false,
    isEditAccommodationModalOpen: false,
    isAddTransportModalOpen: false,
    isEditTransportModalOpen: false,
    isAddActivityModalOpen: false,
    isImageEditorModalOpen: false,
  });

  // Modal data
  const [modalData, setModalData] = useState<ModalData>({
    editingCity: null,
    selectedAttraction: null,
    editingAccommodation: null,
    editingTransport: null,
    selectedActivityDay: null,
    deletingAccommodationId: null,
    deletingTransportId: null,
  });

  // Helper to update modal state
  const updateModal = useCallback((key: keyof ModalStates, value: boolean) => {
    setModals(prev => ({ ...prev, [key]: value }));
  }, []);

  // City modals
  const openAddCityModal = useCallback(() => updateModal('isAddCityModalOpen', true), [updateModal]);
  const openEditCityModal = useCallback((city: City) => {
    setModalData(prev => ({ ...prev, editingCity: city }));
    updateModal('isEditCityModalOpen', true);
  }, [updateModal]);
  const closeAddCityModal = useCallback(() => updateModal('isAddCityModalOpen', false), [updateModal]);
  const closeEditCityModal = useCallback(() => {
    setModalData(prev => ({ ...prev, editingCity: null }));
    updateModal('isEditCityModalOpen', false);
  }, [updateModal]);

  // Attraction modals
  const openAddAttractionModal = useCallback(() => updateModal('isAddAttractionModalOpen', true), [updateModal]);
  const openAttractionDetailModal = useCallback((attraction: Attraction) => {
    setModalData(prev => ({ ...prev, selectedAttraction: attraction }));
    updateModal('isAttractionDetailModalOpen', true);
  }, [updateModal]);
  const openMapModal = useCallback(() => updateModal('isMapModalOpen', true), [updateModal]);
  const closeAddAttractionModal = useCallback(() => updateModal('isAddAttractionModalOpen', false), [updateModal]);
  const closeAttractionDetailModal = useCallback(() => {
    setModalData(prev => ({ ...prev, selectedAttraction: null }));
    updateModal('isAttractionDetailModalOpen', false);
  }, [updateModal]);
  const closeMapModal = useCallback(() => updateModal('isMapModalOpen', false), [updateModal]);

  // Document modal
  const openAddDocumentModal = useCallback(() => updateModal('isAddDocumentModalOpen', true), [updateModal]);
  const closeAddDocumentModal = useCallback(() => updateModal('isAddDocumentModalOpen', false), [updateModal]);

  // Expense modal
  const openAddExpenseModal = useCallback(() => updateModal('isAddExpenseModalOpen', true), [updateModal]);
  const closeAddExpenseModal = useCallback(() => updateModal('isAddExpenseModalOpen', false), [updateModal]);

  // Share modal
  const openShareModal = useCallback(() => updateModal('isShareModalOpen', true), [updateModal]);
  const closeShareModal = useCallback(() => updateModal('isShareModalOpen', false), [updateModal]);

  // Accommodation modals
  const openAddAccommodationModal = useCallback(() => updateModal('isAddAccommodationModalOpen', true), [updateModal]);
  const openEditAccommodationModal = useCallback((accommodation: HotelReservation) => {
    setModalData(prev => ({ ...prev, editingAccommodation: accommodation }));
    updateModal('isEditAccommodationModalOpen', true);
  }, [updateModal]);
  const closeAddAccommodationModal = useCallback(() => updateModal('isAddAccommodationModalOpen', false), [updateModal]);
  const closeEditAccommodationModal = useCallback(() => {
    setModalData(prev => ({ ...prev, editingAccommodation: null }));
    updateModal('isEditAccommodationModalOpen', false);
  }, [updateModal]);
  const setDeletingAccommodationId = useCallback((id: string | null) => {
    setModalData(prev => ({ ...prev, deletingAccommodationId: id }));
  }, []);

  // Transport modals
  const openAddTransportModal = useCallback(() => updateModal('isAddTransportModalOpen', true), [updateModal]);
  const openEditTransportModal = useCallback((transport: Transport) => {
    setModalData(prev => ({ ...prev, editingTransport: transport }));
    updateModal('isEditTransportModalOpen', true);
  }, [updateModal]);
  const closeAddTransportModal = useCallback(() => updateModal('isAddTransportModalOpen', false), [updateModal]);
  const closeEditTransportModal = useCallback(() => {
    setModalData(prev => ({ ...prev, editingTransport: null }));
    updateModal('isEditTransportModalOpen', false);
  }, [updateModal]);
  const setDeletingTransportId = useCallback((id: string | null) => {
    setModalData(prev => ({ ...prev, deletingTransportId: id }));
  }, []);

  // Activity modal
  const openAddActivityModal = useCallback((day: number, date: string) => {
    setModalData(prev => ({ ...prev, selectedActivityDay: { day, date } }));
    updateModal('isAddActivityModalOpen', true);
  }, [updateModal]);
  const closeAddActivityModal = useCallback(() => {
    setModalData(prev => ({ ...prev, selectedActivityDay: null }));
    updateModal('isAddActivityModalOpen', false);
  }, [updateModal]);

  // Image editor modal
  const openImageEditorModal = useCallback(() => updateModal('isImageEditorModalOpen', true), [updateModal]);
  const closeImageEditorModal = useCallback(() => updateModal('isImageEditorModalOpen', false), [updateModal]);

  return {
    modals,
    modalData,
    openAddCityModal,
    openEditCityModal,
    closeAddCityModal,
    closeEditCityModal,
    openAddAttractionModal,
    openAttractionDetailModal,
    openMapModal,
    closeAddAttractionModal,
    closeAttractionDetailModal,
    closeMapModal,
    openAddDocumentModal,
    closeAddDocumentModal,
    openAddExpenseModal,
    closeAddExpenseModal,
    openShareModal,
    closeShareModal,
    openAddAccommodationModal,
    openEditAccommodationModal,
    closeAddAccommodationModal,
    closeEditAccommodationModal,
    setDeletingAccommodationId,
    openAddTransportModal,
    openEditTransportModal,
    closeAddTransportModal,
    closeEditTransportModal,
    setDeletingTransportId,
    openAddActivityModal,
    closeAddActivityModal,
    openImageEditorModal,
    closeImageEditorModal,
  };
};
