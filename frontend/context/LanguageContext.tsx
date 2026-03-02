import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'pt' | 'en' | 'es';

type Translations = {
    [key in Language]: {
        [key: string]: string;
    };
};

const translations: Translations = {
    pt: {
        back_to_dashboard: '← Voltar ao Painel',
        travelers_count: 'Viajantes',
        planning_phase: 'Fase de Planejamento',
        active_trip: 'Viagem Ativa',
        completed: 'Concluída',
        goal_vs_saved: 'Meta vs Guardado',
        available_budget: 'Orçamento Disponível',
        total_spent: 'Total Gasto',
        itinerary: 'Roteiro',
        no_cities: 'Nenhuma cidade adicionada. Busque e adicione seu primeiro destino!',
        add_destination: 'Adicionar Destino',
        search_city_placeholder: 'Digite o nome da cidade (ex: Orlando)...',
        manage_travelers: 'Gerenciar Viajantes',
        traveler_name: 'Nome do viajante...',
        add: 'Adicionar',
        no_travelers: 'Nenhum viajante adicionado.',
        cancel: 'Cancelar',
        save_changes: 'Salvar Alterações',
        budget_savings: 'Orçamento e Reservas',
        define_goals: 'Defina suas metas e guarde dinheiro antes da viagem começar.',
        add_category: 'Adicionar Categoria',
        no_categories: 'Nenhuma categoria definida. Adicione passagens, hotel, alimentação, etc.',
        saved: 'Guardado',
        deposit: 'Depositar',
        new_category: 'Nova Categoria',
        category_name: 'Nome da Categoria',
        how_to_budget: 'Como deseja orçar?',
        general_exp: 'Gasto Geral',
        one_total_goal: 'Uma meta total para toda a viagem',
        per_person: 'Por Pessoa',
        set_indiv_goals: 'Metas específicas para cada viajante',
        total_budget_goal: 'Meta de Orçamento Total',
        traveler_list_goals: 'Lista de Viajantes e Metas Individuais',
        create_category: 'Criar Categoria',
        deposit_savings: 'Depositar Economias',
        amount_to_save: 'Valor a Guardar',
        date: 'Data',
        note: 'Nota (Opcional)',
        confirm_deposit: 'Confirmar Depósito',
        plan_new_trip: 'Planejar Nova Viagem',
        trip_name: 'Nome da Viagem',
        primary_destination: 'Destino Principal',
        start_date: 'Data de Início',
        end_date: 'Data de Término',
        currency: 'Moeda',
        create_trip: 'Criar Viagem',
        logout: 'Sair',
        my_trips: 'Minhas Viagens',
        no_trips_yet: 'Nenhuma viagem ainda!',
        start_planning: 'Comece a planejar sua próxima aventura.',
        expenses: 'Gastos',
        funding_transfers: 'Funding e Transferências',
        route_cities: 'Roteiro e Cidades'
    },
    en: {
        back_to_dashboard: '← Back to Dashboard',
        travelers_count: 'Travelers',
        planning_phase: 'Planning Phase',
        active_trip: 'Active Trip',
        completed: 'Completed',
        goal_vs_saved: 'Goal vs Saved',
        available_budget: 'Available Budget',
        total_spent: 'Total Spent',
        itinerary: 'Itinerary',
        no_cities: 'No cities added yet. Search and add your first destination!',
        add_destination: 'Add Destination',
        search_city_placeholder: 'Type city name (e.g. Orlando)...',
        manage_travelers: 'Manage Travelers',
        traveler_name: 'Traveler name...',
        add: 'Add',
        no_travelers: 'No travelers added.',
        cancel: 'Cancel',
        save_changes: 'Save Changes',
        budget_savings: 'Travel Budgeting',
        define_goals: 'Set your goals and track your pre-trip savings.',
        add_category: 'Add Category',
        no_categories: 'No budget categories yet. Create categories like Flight, Hotel, or Food.',
        saved: 'Pre-trip Saved',
        deposit: 'Deposit',
        new_category: 'New Category',
        category_name: 'Category Name',
        how_to_budget: 'How would you like to budget?',
        general_exp: 'General',
        one_total_goal: 'One total goal for the whole trip',
        per_person: 'Per Person',
        set_indiv_goals: 'Set specific goals for each traveler',
        total_budget_goal: 'Total Budget Goal',
        traveler_list_goals: 'Traveler List & Individual Goals',
        create_category: 'Create Category',
        deposit_savings: 'Piggy Bank Deposit',
        amount_to_save: 'Amount to Save',
        date: 'Date',
        note: 'Note (Optional)',
        confirm_deposit: 'Confirm Deposit',
        plan_new_trip: 'Plan a New Trip',
        trip_name: 'Trip Name',
        primary_destination: 'Primary Destination',
        start_date: 'Start Date',
        end_date: 'End Date',
        currency: 'Currency',
        create_trip: 'Create Trip',
        logout: 'Logout',
        my_trips: 'My Trips',
        no_trips_yet: 'No trips yet!',
        start_planning: 'Start planning your next adventure.',
        expenses: 'Expenses',
        funding_transfers: 'Funding & Transfers',
        route_cities: 'Route & Cities'
    },
    es: {
        back_to_dashboard: '← Volver al Panel',
        travelers_count: 'Viajeros',
        planning_phase: 'Fase de Planificación',
        active_trip: 'Viaje Activo',
        completed: 'Completado',
        goal_vs_saved: 'Meta vs Guardado',
        available_budget: 'Presupuesto Disponible',
        total_spent: 'Total Gastado',
        itinerary: 'Itinerario',
        no_cities: 'No se han añadido ciudades. ¡Busca y añade tu primer destino!',
        add_destination: 'Añadir Destino',
        search_city_placeholder: 'Escribe el nombre de la ciudad (ej: Orlando)...',
        manage_travelers: 'Gestionar Viajeros',
        traveler_name: 'Nombre del viajero...',
        add: 'Añadir',
        no_travelers: 'No hay viajeros añadidos.',
        cancel: 'Cancelar',
        save_changes: 'Guardar Cambios',
        budget_savings: 'Presupuesto y Ahorros',
        define_goals: 'Establece tus metas y ahorra dinero antes de que comience el viaje.',
        add_category: 'Añadir Categoría',
        no_categories: 'No hay categorías definidas. Añade vuelos, hotel, comida, etc.',
        saved: 'Guardado',
        deposit: 'Depositar',
        new_category: 'Nueva Categoría',
        category_name: 'Nombre de la Categoría',
        how_to_budget: '¿Cómo prefieres presupuestar?',
        general_exp: 'General',
        one_total_goal: 'Una meta total para todo el viaje',
        per_person: 'Por Persona',
        set_indiv_goals: 'Metas específicas para cada viajero',
        total_budget_goal: 'Meta de Presupuesto Total',
        traveler_list_goals: 'Lista de Viajeros y Metas Individuales',
        create_category: 'Crear Categoría',
        deposit_savings: 'Depositar Ahorros',
        amount_to_save: 'Cantidad a Ahorrar',
        date: 'Fecha',
        note: 'Nota (Opcional)',
        confirm_deposit: 'Confirmar Depósito',
        plan_new_trip: 'Planificar Nuevo Viaje',
        trip_name: 'Nombre del Viaje',
        primary_destination: 'Destino Principal',
        start_date: 'Fecha de Inicio',
        end_date: 'Fecha de Fin',
        currency: 'Moneda',
        create_trip: 'Crear Viaje',
        logout: 'Cerrar Sesión',
        my_trips: 'Mis Viajes',
        no_trips_yet: '¡Aún no hay viajes!',
        start_planning: 'Comienza a planificar tu próxima aventura.',
        expenses: 'Gastos',
        funding_transfers: 'Financiamiento y Transferencias',
        route_cities: 'Ruta y Ciudades'
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('pt');

    useEffect(() => {
        const savedLang = localStorage.getItem('language') as Language;
        if (savedLang && (savedLang === 'pt' || savedLang === 'en' || savedLang === 'es')) {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
