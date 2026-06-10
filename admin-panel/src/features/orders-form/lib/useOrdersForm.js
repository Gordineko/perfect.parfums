import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { createAdminOrder, updateAdminOrder } from '../../../shared/api/orders.services'; 
import toast from '../../../shared/lib/toast';
import { DELIVERY_TYPES } from '../../../features/delivery/const/delivery'; 

const formatPayload = (values) => ({
    customer: {
        lastName: values.customer?.lastName || "",
        firstName: values.customer?.firstName || "",
        middleName: values.customer?.middleName || "",
        customerPhone: values.customer?.customerPhone || "",
        customerEmail: values.customer?.customerEmail || ""
    },
    delivery: {
        deliveryMethod: values.delivery?.deliveryMethod || "",
        deliveryProvince: values.delivery?.deliveryProvince || "",
        deliveryCity: values.delivery?.deliveryCity || "",
        deliveryPostOffice: values.delivery?.deliveryPostOffice || ""
    },
    paymentInfo: {
        payment: values.paymentInfo?.payment || "",
        paymentStatus: values.paymentInfo?.paymentStatus || "pending",
        installmentMonths: Number(values.paymentInfo?.installmentMonths) || 0
    },
    discount: {
        adminDiscount: Number(values.discount?.adminDiscount) || 0,
        adminDiscountComment: values.discount?.adminDiscountComment || ""
    },
    status: values.status || "new",
    adminComment: values.adminComment || "",
    items: values.items?.map(item => ({
        offerId: typeof item.offerId === 'object' ? item.offerId._id : item.offerId,
        qty: Number(item.qty),
        pricePerUnit: Number(item.pricePerUnit)
    })) || []
});

export const useOrdersForm = (type, initialData) => {
    const navigate = useNavigate();

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            customer: {
                lastName: initialData?.customer?.lastName || '',
                firstName: initialData?.customer?.firstName || '',
                middleName: initialData?.customer?.middleName || '',
                customerPhone: initialData?.customer?.customerPhone || '',
                customerEmail: initialData?.customer?.customerEmail || ''
            },
            delivery: {
                // Если бэкенд прислал пустоту (""), берем правильную константу Новой Почты
                deliveryMethod: initialData?.delivery?.deliveryMethod || DELIVERY_TYPES.NOVA_POSHTA_BRANCH,
                deliveryProvince: initialData?.delivery?.deliveryProvince || '',
                deliveryCity: initialData?.delivery?.deliveryCity || '',
                deliveryPostOffice: initialData?.delivery?.deliveryPostOffice || ''
            },
            paymentInfo: {
                payment: initialData?.paymentInfo?.payment || 'online',
                paymentStatus: initialData?.paymentInfo?.paymentStatus || 'pending',
                installmentMonths: initialData?.paymentInfo?.installmentMonths || 0
            },
            discount: {
                adminDiscount: initialData?.pricing?.adminDiscount || 0,
                adminDiscountComment: initialData?.pricing?.adminDiscountComment || ''
            },
            status: initialData?.status || 'new',
            adminComment: initialData?.adminComment || '',
            items: initialData?.items || [] 
        },
        validationSchema: Yup.object({
            customer: Yup.object({
                firstName: Yup.string().required("Ім'я обов'язкове"),
                customerPhone: Yup.string().required("Телефон обов'язковий"),
            }),
            status: Yup.string().required("Статус обов'язковий"),
        }),
        onSubmit: async (values) => {
            try {
                const payload = formatPayload(values);
                
                if (type === 'create') {
                    const response = await createAdminOrder(payload);
                    if (response?.error) throw new Error(response.message || 'Помилка при створенні');
                    toast.success('Замовлення успішно створено!');
                } else {
                    const orderId = initialData?._id; 
                    if (!orderId) throw new Error("Немає ID замовлення для оновлення");

                    const response = await updateAdminOrder(orderId, payload);
                    if (response?.error) throw new Error(response.message || 'Помилка при оновленні');
                    toast.success('Замовлення успішно оновлено!');
                }
                
                navigate('/orders'); 

            } catch (error) {
                console.error('Помилка при збереженні:', error);
                toast.error(error.message || 'Сталася помилка. Спробуйте ще раз.');
            }
        },
    });

    return formik;
};