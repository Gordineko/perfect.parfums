"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useCategoryForm } from '../lib/useCategoryForm';
import CustomSelect from '../../../shared/ui/select-form/CustomSelect';
import CustomInput from '../../../shared/ui/input-form/CustomInput';
import { generateSlug } from '../lib/generateSlug';
import { getStatusOptions } from '../../../shared/lib/statuses';
import { useAutoTranslate } from '../../../shared/lib/useAutoTranslate';
import TranslateButton from '../../../shared/ui/translate-button/TranslateButton';
import { getAdminCategoriesTree } from '../../../shared/api/categories.services';
import AdminPageLoader from '../../../shared/ui/admin-loader/AdminPageLoader';

const STATUS_OPTIONS = getStatusOptions(['active', 'hidden', 'draft'], { labelType: 'form' });

const CategoryForm = ({ type, initialData }) => {
    const formik = useCategoryForm(type, initialData);
    const { translateFields, isTranslating } = useAutoTranslate(formik);
    const [categoryTree, setCategoryTree] = useState([]);
    const axes = formik.values.variationTemplate || [];
    const canEditVariationTemplate = initialData?.isVariationTemplateOwner ?? !formik.values.parentId;

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const treeData = await getAdminCategoriesTree();
                const categoriesArray = treeData?.items || treeData?.data || (Array.isArray(treeData) ? treeData : []);
                setCategoryTree(Array.isArray(categoriesArray) ? categoriesArray : []);
            } catch (error) {
                console.error('Помилка завантаження дерева категорій:', error);
                setCategoryTree([]);
            }
        };

        fetchCategories();
    }, []);

    const parentOptions = useMemo(() => {
        const currentId = String(initialData?._id || '');
        const blockedIds = new Set();

        const walkCollect = (node) => {
            const nodeId = String(node?._id || node?.id || '');
            if (!nodeId) return;
            blockedIds.add(nodeId);
            (node.children || []).forEach(walkCollect);
        };

        const findNodeById = (nodes) => {
            for (const node of nodes) {
                const nodeId = String(node?._id || node?.id || '');
                if (nodeId && nodeId === currentId) return node;
                const foundInChild = findNodeById(node.children || []);
                if (foundInChild) return foundInChild;
            }
            return null;
        };

        if (currentId) {
            const currentNode = findNodeById(categoryTree);
            if (currentNode) {
                walkCollect(currentNode);
            } else {
                blockedIds.add(currentId);
            }
        }

        const flatten = (nodes, depth = 0) => {
            const list = [];
            nodes.forEach((node) => {
                const nodeId = String(node?._id || node?.id || '');
                const title = node?.title?.ua || node?.title?.en || node?.title || 'Без назви';

                if (nodeId && !blockedIds.has(nodeId)) {
                    list.push({
                        value: nodeId,
                        label: `${'— '.repeat(depth)}${title}`,
                    });
                }

                list.push(...flatten(node.children || [], depth + 1));
            });
            return list;
        };

        return [
            { value: '', label: 'Без батьківської (коренева)' },
            ...flatten(categoryTree),
        ];
    }, [categoryTree, initialData?._id]);

    useEffect(() => {
        const titleUa = formik.values.title?.ua;

        if (titleUa && !initialData?.slug) {
            const newSlug = generateSlug(titleUa);
            formik.setFieldValue('slug', newSlug);
        } else if (!titleUa && !initialData?.slug) {
            formik.setFieldValue('slug', '');
        }
       
    }, [formik.values.title?.ua]);

  
    const handleNestedChange = (field) => (e) => {
        const value = e?.target !== undefined ? e.target.value : e;
        formik.setFieldValue(field, value);
    };

    const handleAddAxis = () => {
        const nextNum = axes.length > 0
            ? Math.max(...axes.map((a) => parseInt(String(a.axisId || '').replace('A', ''), 10) || 0)) + 1
            : 1;

        const newAxis = {
            axisId: `A${nextNum}`,
            title: { ua: '', en: '' },
            type: 'select',
            unit: null,
            valuesPreset: []
        };

        formik.setFieldValue('variationTemplate', [...axes, newAxis]);
    };

    const handleRemoveAxis = (indexToRemove) => {
        const updated = axes.filter((_, i) => i !== indexToRemove);
        formik.setFieldValue('variationTemplate', updated);
    };

    const normalizeSelectPresetItem = (item) => {
        if (item && typeof item === 'object') {
            const ua = item.label?.ua || '';
            const en = item.label?.en || '';
            const value = item.value || generateSlug(ua || en || '');
            return {
                value,
                label: {
                    ua,
                    en
                }
            };
        }

        const text = String(item ?? '');
        return {
            value: generateSlug(text),
            label: {
                ua: text,
                en: text
            }
        };
    };

    const handleAxisTypeChange = (axisIndex, nextType) => {
        const axis = formik.values.variationTemplate?.[axisIndex] || {};
        const preset = Array.isArray(axis.valuesPreset) ? axis.valuesPreset : [];

        const normalizedPreset = nextType === 'number'
            ? preset.map((item) => (item && typeof item === 'object' ? String(item.value ?? '') : String(item ?? '')))
            : preset.map(normalizeSelectPresetItem);

        formik.setFieldValue(`variationTemplate[${axisIndex}]`, {
            ...axis,
            type: nextType,
            valuesPreset: normalizedPreset,
        });
    };

    return (
        <form id="category-create-form" onSubmit={formik.handleSubmit} className="product-form">
            {formik.isSubmitting && (
                <AdminPageLoader label="Збереження категорії..." fullScreen />
            )}
            <h1>Дані категорії</h1>

            <div className="form-translate-bar">
                <TranslateButton
                    isLoading={isTranslating}
                    onClick={() => {
                        const axisPairs = (formik.values.variationTemplate || []).map((_, i) => ({
                            from: `variationTemplate.${i}.title.ua`,
                            to: `variationTemplate.${i}.title.en`,
                        }));

                        translateFields([
                            { from: 'title.ua', to: 'title.en' },
                            { from: 'description.ua', to: 'description.en' },
                            ...axisPairs,
                        ]);
                    }}
                />
            </div>

            {/* === НАЗВА === */}
            <div className="form-wrapper-2-column">
                <CustomInput
                    id="title.ua" name="title.ua" label="Назва категорії (UA)"
                    value={formik.values.title?.ua || ''} 
                    onChange={handleNestedChange('title.ua')} 
                    onBlur={formik.handleBlur}
                    placeholder="Введіть назву українською" error={formik.errors.title?.ua} touched={formik.touched.title?.ua}
                />
                <CustomInput
                    id="title.en" name="title.en" label="Назва категорії (EN)"
                    value={formik.values.title?.en || ''} 
                    onChange={handleNestedChange('title.en')} 
                    onBlur={formik.handleBlur}
                    placeholder="Enter category title" error={formik.errors.title?.en} touched={formik.touched.title?.en}
                />
            </div>

            {/* === SLUG ТА СТАТУС === */}
            <div className="form-wrapper-2-column">
                <CustomInput
                    id="slug" name="slug" label="Slug (URL категорії)"
                    value={formik.values.slug || ''} 
                    onChange={formik.handleChange} 
                    onBlur={formik.handleBlur}
                    placeholder="generyetsya-avtomatichno" error={formik.errors.slug} touched={formik.touched.slug}
                />
                
                <div className="form-group">
                    <label htmlFor="status">Статус</label>
                    <div className="input-wrapper">
                        <CustomSelect
                            options={STATUS_OPTIONS} 
                            value={formik.values.status}
                            onChange={(value) => formik.setFieldValue('status', value)} 
                            onBlur={formik.handleBlur}
                            name="status"
                            id="status"
                            error={formik.errors.status}
                            touched={formik.touched.status}
                            placeholder="Виберіть статус"
                        />
                    </div>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="parentId">Батьківська категорія</label>
                <div className="input-wrapper">
                    <CustomSelect
                        options={parentOptions}
                        value={formik.values.parentId || ''}
                        onChange={(value) => formik.setFieldValue('parentId', value || '')}
                        onBlur={formik.handleBlur}
                        name="parentId"
                        id="parentId"
                        placeholder={parentOptions.length > 1 ? 'Оберіть батьківську категорію' : 'Завантаження...'}
                    />
                </div>
            </div>

            {/* === ОПИС === */}
            <CustomInput
                id="description.ua" name="description.ua" label="Опис категорії (UA)"
                value={formik.values.description?.ua || ''} 
                onChange={handleNestedChange('description.ua')} 
                onBlur={formik.handleBlur}
                placeholder="Опис українською..." error={formik.errors.description?.ua} touched={formik.touched.description?.ua}
            />
            <CustomInput
                id="description.en" name="description.en" label="Опис категорії (EN)"
                value={formik.values.description?.en || ''} 
                onChange={handleNestedChange('description.en')} 
                onBlur={formik.handleBlur}
                placeholder="Description in English..." error={formik.errors.description?.en} touched={formik.touched.description?.en}
            />

            <h1 className="product-form__section-title">Осі варіацій (Налаштування)</h1>
            {!canEditVariationTemplate && (
                <p style={{ margin: '0 0 16px', color: '#64748B' }}>
                    Для дочірніх категорій шаблон осей не редагується. Для товарів цієї гілки використовується шаблон кореневої категорії.
                </p>
            )}

            {canEditVariationTemplate && (
                <div className="product__axes">
                    {axes.map((axis, i) => (
                        <div key={axis.axisId || i} className="product__axes-item">
                            <div className="product__axes-header">
                                <strong>Вісь: {axis.axisId}</strong>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAxis(i)}
                                    className="btn-remove"
                                >
                                    - Видалити вісь
                                </button>
                            </div>

                            <div className="form-wrapper-2-column">
                                <CustomInput
                                    id={`axes-${i}-title-ua`}
                                    name={`variationTemplate[${i}].title.ua`}
                                    label="Назва осі (UA)"
                                    value={formik.values.variationTemplate[i]?.title?.ua || ''}
                                    onChange={formik.handleChange}
                                    placeholder="Напр. Колір, Розмір..."
                                />
                                <CustomInput
                                    id={`axes-${i}-title-en`}
                                    name={`variationTemplate[${i}].title.en`}
                                    label="Назва осі (EN)"
                                    value={formik.values.variationTemplate[i]?.title?.en || ''}
                                    onChange={formik.handleChange}
                                    placeholder="Color, Size..."
                                />
                            </div>

                            <div className="form-wrapper-2-column" style={{ marginTop: '10px' }}>
                                <div className="form-group">
                                    <label>Тип осі</label>
                                    <div className="input-wrapper">
                                        <CustomSelect
                                            options={[
                                                { value: 'select', label: 'select (з перекладами)' },
                                                { value: 'number', label: 'number (числа)' },
                                            ]}
                                            value={formik.values.variationTemplate[i]?.type || 'select'}
                                            onChange={(val) => handleAxisTypeChange(i, val)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="product__axes-values">
                                <label className="product__axes-values-title">Доступні значення</label>
                                {(formik.values.variationTemplate[i]?.type || 'select') === 'select' ? (
                                    <>
                                        {(formik.values.variationTemplate[i]?.valuesPreset || []).map((rawItem, vi) => {
                                            const item = normalizeSelectPresetItem(rawItem);
                                            return (
                                                <div key={vi} className="product__axes-value-row" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
                                                    <CustomInput
                                                        id={`axes-${i}-val-${vi}-ua`}
                                                        label="Назва (UA)"
                                                        value={item.label?.ua ?? ''}
                                                        onChange={(e) => {
                                                            const preset = [...(formik.values.variationTemplate[i]?.valuesPreset || [])];
                                                            const prev = normalizeSelectPresetItem(preset[vi]);
                                                            const nextLabel = {
                                                                ...(prev.label || {}),
                                                                ua: e.target.value,
                                                            };
                                                            preset[vi] = {
                                                                value: generateSlug(nextLabel.ua || nextLabel.en || ''),
                                                                label: nextLabel,
                                                            };
                                                            formik.setFieldValue(`variationTemplate[${i}].valuesPreset`, preset);
                                                        }}
                                                        placeholder="Чорний"
                                                    />
                                                    <CustomInput
                                                        id={`axes-${i}-val-${vi}-en`}
                                                        label="Назва (EN)"
                                                        value={item.label?.en ?? ''}
                                                        onChange={(e) => {
                                                            const preset = [...(formik.values.variationTemplate[i]?.valuesPreset || [])];
                                                            const prev = normalizeSelectPresetItem(preset[vi]);
                                                            const nextLabel = {
                                                                ...(prev.label || {}),
                                                                en: e.target.value,
                                                            };
                                                            preset[vi] = {
                                                                value: generateSlug(nextLabel.ua || nextLabel.en || ''),
                                                                label: nextLabel,
                                                            };
                                                            formik.setFieldValue(`variationTemplate[${i}].valuesPreset`, preset);
                                                        }}
                                                        placeholder="Black"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn-remove"
                                                        onClick={() => {
                                                            const preset = (formik.values.variationTemplate[i]?.valuesPreset || []).filter((_, idx) => idx !== vi);
                                                            formik.setFieldValue(`variationTemplate[${i}].valuesPreset`, preset);
                                                        }}
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            );
                                        })}

                                        <button
                                            type="button"
                                            className="btn-add-secondary"
                                            onClick={() => {
                                                const preset = [...(formik.values.variationTemplate[i]?.valuesPreset || []), { value: '', label: { ua: '', en: '' } }];
                                                formik.setFieldValue(`variationTemplate[${i}].valuesPreset`, preset);
                                            }}
                                        >
                                            + Додати значення
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {(formik.values.variationTemplate[i]?.valuesPreset || []).map((rawItem, vi) => {
                                            const value = rawItem && typeof rawItem === 'object' ? String(rawItem.value ?? '') : String(rawItem ?? '');
                                            return (
                                                <div key={vi} className="product__axes-value-row" style={{ gridTemplateColumns: '1fr auto' }}>
                                                    <CustomInput
                                                        id={`axes-${i}-val-${vi}-number`}
                                                        label="Числове значення"
                                                        value={value}
                                                        onChange={(e) => {
                                                            const preset = [...(formik.values.variationTemplate[i]?.valuesPreset || [])];
                                                            preset[vi] = e.target.value;
                                                            formik.setFieldValue(`variationTemplate[${i}].valuesPreset`, preset);
                                                        }}
                                                        placeholder="38"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn-remove"
                                                        onClick={() => {
                                                            const preset = (formik.values.variationTemplate[i]?.valuesPreset || []).filter((_, idx) => idx !== vi);
                                                            formik.setFieldValue(`variationTemplate[${i}].valuesPreset`, preset);
                                                        }}
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            );
                                        })}

                                        <button
                                            type="button"
                                            className="btn-add-secondary"
                                            onClick={() => {
                                                const preset = [...(formik.values.variationTemplate[i]?.valuesPreset || []), ''];
                                                formik.setFieldValue(`variationTemplate[${i}].valuesPreset`, preset);
                                            }}
                                        >
                                            + Додати значення
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    <button type="button" onClick={handleAddAxis} className="btn-add-secondary">
                        + Додати вісь
                    </button>
                </div>
            )}

            {/* === ДЕБАГ: ПОМИЛКИ ФОРМИ === */}
            {Object.keys(formik.errors).length > 0 && (
                <div style={{ marginTop: '24px', padding: '16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
                    <strong style={{ color: '#DC2626', fontSize: '13px' }}>Помилки форми (чому не зберігається):</strong>
                    <pre style={{ marginTop: '8px', fontSize: '12px', color: '#7F1D1D', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {JSON.stringify(formik.errors, null, 2)}
                    </pre>
                </div>
            )}

        </form>
    );
};

export default CategoryForm;
