import { useEffect, useMemo } from 'react';

export function useOfferImageSync({ axes = [], offers = [], setFieldValue }) {
    const imageVariantAxis = useMemo(() => {
        if (!axes.length) return null;

        const axisHasValues = (axisId) => {
            if (!axisId) return false;
            return offers.some((offer) => String(offer?.options?.[axisId] ?? '').trim() !== '');
        };

        // Sync by only the main size axis ("Розмір"), not insole size.
        const isMainSizeAxis = (item) => {
            const titleUa = String(item?.title?.ua || '').toLowerCase();
            const titleEn = String(item?.title?.en || '').toLowerCase();
            const title = `${titleUa} ${titleEn}`;
            const isSizeLike = title.includes('розмір') || title.includes('размер') || title.includes('size') || title.trim() === 'a6';
            const isInsoleLike = title.includes('устіл') || title.includes('стельк') || title.includes('insole');
            return isSizeLike && !isInsoleLike;
        };

        const sizeAxisById = axes.find((item) => String(item?.axisId) === 'A6');
        if (sizeAxisById && axisHasValues(sizeAxisById.axisId)) return sizeAxisById;

        const sizeAxisByTitle = axes.find((item) => item?.axisId && isMainSizeAxis(item) && axisHasValues(item.axisId));
        if (sizeAxisByTitle) return sizeAxisByTitle;

        // If "Розмір" axis does not exist, do not apply cross-offer image sync.
        return null;
    }, [axes, offers]);

    const imageSyncAxes = useMemo(
        () => (imageVariantAxis ? axes.filter((axis) => axis?.axisId && axis.axisId !== imageVariantAxis.axisId) : []),
        [axes, imageVariantAxis]
    );

    const imageSyncAxesKey = useMemo(
        () => imageSyncAxes.map((axis) => axis.axisId).join('|'),
        [imageSyncAxes]
    );

    useEffect(() => {
        if (!imageVariantAxis || !offers.length) return;

        const getOfferImageClusterKey = (offer) => {
            if (!imageSyncAxes.length) return '__all_last_axis_values__';

            const keyParts = [];
            for (const axis of imageSyncAxes) {
                const axisValue = String(offer?.options?.[axis.axisId] || '').trim();
                if (!axisValue) continue;
                keyParts.push(`${axis.axisId}:${axisValue}`);
            }

            if (!keyParts.length) return '';
            return keyParts.join('|');
        };

        const imageByCluster = new Map();

        offers.forEach((offer) => {
            const image = typeof offer?.image === 'string' ? offer.image.trim() : '';
            if (!image) return;

            const clusterKey = getOfferImageClusterKey(offer);
            if (!clusterKey) return;

            if (!imageByCluster.has(clusterKey)) {
                imageByCluster.set(clusterKey, image);
            }
        });

        if (!imageByCluster.size) return;

        const syncedOffers = offers.map((offer) => {
            const currentImage = typeof offer?.image === 'string' ? offer.image.trim() : '';
            if (currentImage) return offer;

            const clusterKey = getOfferImageClusterKey(offer);
            const sharedImage = imageByCluster.get(clusterKey);
            if (!sharedImage) return offer;

            return {
                ...offer,
                image: sharedImage,
            };
        });

        if (JSON.stringify(syncedOffers) !== JSON.stringify(offers)) {
            setFieldValue('offers', syncedOffers, false);
        }
    }, [offers, imageVariantAxis, imageSyncAxes, imageSyncAxesKey, setFieldValue]);
}
