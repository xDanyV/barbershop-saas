export type PublicBusinessSettings = {
    isServiceActive: boolean;
    maintenanceMessage: string | null;
};

export type PublicBusinessBarber = {
    id: string;
    user: {
        name: string | null;
    };
};

export type PublicBusinessService = {
    id: string;
    name: string;
    priceCents: number;
    duration: number;
    barber: {
        id: string;
        user: {
            name: string | null;
        };
    };
};

export type PublicBusinessGalleryItem = {
    id: string;
    imageUrl: string;
    caption: string | null;
    position: number;
};

export type PublicBusinessPost = {
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: Date;
};

export type GroupedService = {
    key: string;
    name: string;
    minPriceCents: number;
    maxPriceCents: number;
    minDuration: number;
    maxDuration: number;
    barberNames: string[];
};