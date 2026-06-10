import {
    createAdminCatalogGroup,
    createAdminCatalogOffer,
    deleteAdminCatalogOffer,
    getAdminCatalogGroupVariationById,
    patchAdminCatalogGroup,
    patchAdminCatalogOffer,
    patchAdminCatalogOfferAccessories,
} from '../../../shared/api/products.services';
import toast from '../../../shared/lib/toast';
import {
    areOfferAccessoriesEqual,
    buildOfferAccessoriesPayload,
    buildOfferOptionKey,
    normalizeAccessoryOfferId,
} from './productFormHelpers';

const MAX_UNIQUENESS_ATTEMPTS = 20;

const isUniquenessCollisionError = (error) => {
    const message = String(error?.message || '').toLowerCase();
    return (
        message.includes('slug already exists') ||
        message.includes('slug exists') ||
        message.includes('sku already exists') ||
        message.includes('sku exists') ||
        message.includes('duplicate key')
    );
};

const withNumericSuffix = (value, attemptIndex) => {
    const base = String(value || '').trim();
    if (!base) return base;

    const cleanedBase = base.replace(/-\d+$/, '');
    return `${cleanedBase}-${attemptIndex + 2}`;
};

const createGroupWithUniqueSlug = async (payload) => {
    let lastError = null;

    for (let attempt = 0; attempt < MAX_UNIQUENESS_ATTEMPTS; attempt += 1) {
        const nextPayload = {
            ...payload,
            slug: attempt === 0 ? payload.slug : withNumericSuffix(payload.slug, attempt - 1),
        };

        try {
            return await createAdminCatalogGroup(nextPayload);
        } catch (error) {
            lastError = error;
            if (!isUniquenessCollisionError(error)) {
                throw error;
            }
        }
    }

    throw lastError || new Error('Не вдалося згенерувати унікальний slug');
};

const createOfferWithUniqueFields = async (groupId, payload) => {
    let lastError = null;

    for (let attempt = 0; attempt < MAX_UNIQUENESS_ATTEMPTS; attempt += 1) {
        const nextPayload = { ...payload };

        if (attempt > 0) {
            if (nextPayload.slug) {
                nextPayload.slug = withNumericSuffix(nextPayload.slug, attempt - 1);
            }
            if (nextPayload.sku) {
                nextPayload.sku = withNumericSuffix(nextPayload.sku, attempt - 1);
            }
        }

        try {
            return await createAdminCatalogOffer(groupId, nextPayload);
        } catch (error) {
            lastError = error;
            if (!isUniquenessCollisionError(error)) {
                throw error;
            }
        }
    }

    throw lastError || new Error('Не вдалося створити оффер через конфлікт slug/sku');
};

export async function handleProductFormSubmit({
    type,
    values,
    initialData,
    variationsData,
    navigate,
    formatPayload,
    buildGroupPatchPayload,
    buildOfferCreatePayload,
    buildOfferUpdatePayload,
    areOffersEqual,
}) {
    try {
        if (type === 'create') {
            const payload = formatPayload(values);
            const createdGroupResponse = await createGroupWithUniqueSlug(payload);

            const createdGroupId = String(createdGroupResponse?.item?._id || createdGroupResponse?._id || '').trim();
            const offersWithAccessory = (values.offers || []).filter((offer) => normalizeAccessoryOfferId(offer));

            if (createdGroupId && offersWithAccessory.length > 0) {
                const offersResult = await getAdminCatalogGroupVariationById(createdGroupId, {
                    page: 1,
                    limit: Math.max((values.offers || []).length || 1, 100),
                });

                const createdOffers = offersResult?.items || offersResult?.item?.offers || [];
                const createdOfferIdByOptionKey = new Map(
                    createdOffers.map((offer) => [buildOfferOptionKey(offer), String(offer?._id || '')])
                );

                await Promise.all(
                    offersWithAccessory.map((offer) => {
                        const createdOfferId = createdOfferIdByOptionKey.get(buildOfferOptionKey(offer));
                        if (!createdOfferId) return Promise.resolve();

                        return patchAdminCatalogOfferAccessories(
                            createdOfferId,
                            buildOfferAccessoriesPayload(offer)
                        );
                    })
                );
            }

            toast.success('Товар успішно створено!');
        } else {
            const groupId = initialData?._id;
            const initialOffers = variationsData?.items || [];
            const nextOffers = values.offers || [];

            const nextOfferIds = new Set(
                nextOffers
                    .filter((offer) => offer?._id)
                    .map((offer) => String(offer._id))
            );

            const offersToDelete = initialOffers.filter(
                (offer) => offer?._id && !nextOfferIds.has(String(offer._id))
            );

            const initialOffersById = new Map(
                initialOffers
                    .filter((offer) => offer?._id)
                    .map((offer) => [String(offer._id), offer])
            );

            const offersToUpdate = nextOffers.filter((offer) => {
                if (!offer?._id) return false;
                const initialOffer = initialOffersById.get(String(offer._id));
                if (!initialOffer) return true;
                return !areOffersEqual(offer, initialOffer);
            });

            const offersToCreate = nextOffers.filter((offer) => !offer?._id);

            await patchAdminCatalogGroup(groupId, buildGroupPatchPayload(values));
            await Promise.all(offersToDelete.map((offer) => deleteAdminCatalogOffer(offer._id)));
            await Promise.all(
                offersToUpdate.map((offer) =>
                    patchAdminCatalogOffer(offer._id, buildOfferUpdatePayload(offer))
                )
            );
            const createdOfferResponses = await Promise.all(
                offersToCreate.map((offer) =>
                    createOfferWithUniqueFields(groupId, buildOfferCreatePayload(offer))
                )
            );

            const accessoryPatches = [];

            nextOffers.forEach((offer) => {
                if (!offer?._id) return;

                const initialOffer = initialOffersById.get(String(offer._id));
                if (initialOffer && areOfferAccessoriesEqual(offer, initialOffer)) {
                    return;
                }

                accessoryPatches.push({
                    offerId: offer._id,
                    payload: buildOfferAccessoriesPayload(offer),
                });
            });

            createdOfferResponses.forEach((response, index) => {
                const createdOfferId = String(response?.item?._id || response?._id || '').trim();
                const createdOfferDraft = offersToCreate[index];

                if (!createdOfferId || !normalizeAccessoryOfferId(createdOfferDraft)) {
                    return;
                }

                accessoryPatches.push({
                    offerId: createdOfferId,
                    payload: buildOfferAccessoriesPayload(createdOfferDraft),
                });
            });

            await Promise.all(
                accessoryPatches.map(({ offerId, payload }) =>
                    patchAdminCatalogOfferAccessories(offerId, payload)
                )
            );

            toast.success('Товар успішно оновлено!');
        }

        navigate('/products');

    } catch (error) {
        console.error('Помилка при збереженні:', error);
        toast.error(error.message || 'Сталася помилка. Спробуйте ще раз.');
    }
}
