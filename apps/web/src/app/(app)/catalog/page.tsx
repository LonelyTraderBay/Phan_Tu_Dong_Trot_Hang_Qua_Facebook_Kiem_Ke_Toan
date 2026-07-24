'use client';

import {
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ApiClientError,
  createProduct,
  createVariant,
  deleteProduct,
  deleteVariant,
  getProduct,
  listProducts,
  updateProduct,
  updateVariant,
  type CatalogProduct,
  type CatalogVariant,
  type ProductStatus,
} from '../../../lib/api-client';
import { SESSION_CHANGED_EVENT } from '../../../lib/auth-session';

const emptyProductForm = {
  title: '',
  description: '',
  status: 'active' as ProductStatus,
};

const emptyVariantForm = {
  sku: '',
  title: '',
  priceVnd: '',
  stockQty: 0,
};

export default function CatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(
    null,
  );
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [variantForm, setVariantForm] = useState(emptyVariantForm);
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingVariant, setSavingVariant] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedProductId = selectedProduct?.id ?? null;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listProducts();
      setProducts(data);
      if (selectedProductId) {
        const detail = await getProduct(selectedProductId);
        setSelectedProduct(detail);
      } else if (data[0]) {
        setSelectedProduct(await getProduct(data[0].id));
      } else {
        setSelectedProduct(null);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải danh mục sản phẩm.'));
      setProducts([]);
      setSelectedProduct(null);
    } finally {
      setLoading(false);
    }
  }, [selectedProductId]);

  useEffect(() => {
    function handleSessionChanged() {
      setSelectedProduct(null);
      setEditingVariantId(null);
      void loadProducts();
    }

    void loadProducts();
    window.addEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
    window.addEventListener('storage', handleSessionChanged);

    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
      window.removeEventListener('storage', handleSessionChanged);
    };
  }, [loadProducts]);

  useEffect(() => {
    if (!selectedProduct) {
      setProductForm(emptyProductForm);
      return;
    }

    setProductForm({
      title: selectedProduct.title,
      description: selectedProduct.description ?? '',
      status: selectedProduct.status,
    });
  }, [selectedProduct]);

  const editingVariant = useMemo(
    () =>
      selectedProduct?.variants?.find((variant) => variant.id === editingVariantId) ??
      null,
    [editingVariantId, selectedProduct],
  );

  useEffect(() => {
    if (!editingVariant) {
      setVariantForm(emptyVariantForm);
      return;
    }

    setVariantForm({
      sku: editingVariant.sku,
      title: editingVariant.title,
      priceVnd: editingVariant.priceVnd,
      stockQty: editingVariant.stockQty,
    });
  }, [editingVariant]);

  async function selectProduct(productId: string) {
    setError(null);
    setMessage(null);
    setEditingVariantId(null);

    try {
      setSelectedProduct(await getProduct(productId));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải chi tiết sản phẩm.'));
    }
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProduct(true);
    setError(null);
    setMessage(null);

    const title = productForm.title.trim();
    if (!title) {
      setError('Vui lòng nhập tên sản phẩm.');
      setSavingProduct(false);
      return;
    }

    try {
      const payload = {
        title,
        description: productForm.description.trim() || null,
        status: productForm.status,
        attrs: {},
      };
      const product = selectedProduct
        ? await updateProduct(selectedProduct.id, payload)
        : await createProduct(payload);

      setMessage(
        selectedProduct ? 'Đã cập nhật sản phẩm.' : 'Đã tạo sản phẩm mới.',
      );
      setSelectedProduct(await getProduct(product.id));
      setProducts(await listProducts());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể lưu sản phẩm.'));
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDeleteProduct() {
    if (!selectedProduct) {
      return;
    }

    setSavingProduct(true);
    setError(null);
    setMessage(null);

    try {
      await deleteProduct(selectedProduct.id);
      setSelectedProduct(null);
      setEditingVariantId(null);
      setProductForm(emptyProductForm);
      setProducts(await listProducts());
      setMessage('Đã xoá sản phẩm khỏi danh mục.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xoá sản phẩm.'));
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleVariantSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) {
      setError('Hãy chọn sản phẩm trước khi lưu phiên bản.');
      return;
    }

    setSavingVariant(true);
    setError(null);
    setMessage(null);

    const sku = variantForm.sku.trim();
    const title = variantForm.title.trim();
    const priceVnd = variantForm.priceVnd.trim();

    if (!sku || !title || !/^\d+$/.test(priceVnd)) {
      setError('Vui lòng nhập SKU, tên phiên bản và giá VND hợp lệ.');
      setSavingVariant(false);
      return;
    }

    try {
      const payload = {
        sku,
        title,
        priceVnd,
        stockQty: Number(variantForm.stockQty),
        attrs: {},
      };

      if (editingVariantId) {
        await updateVariant(selectedProduct.id, editingVariantId, payload);
      } else {
        await createVariant(selectedProduct.id, payload);
      }

      setSelectedProduct(await getProduct(selectedProduct.id));
      setEditingVariantId(null);
      setVariantForm(emptyVariantForm);
      setMessage(editingVariantId ? 'Đã cập nhật phiên bản.' : 'Đã thêm phiên bản.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể lưu phiên bản.'));
    } finally {
      setSavingVariant(false);
    }
  }

  async function handleDeleteVariant(variant: CatalogVariant) {
    if (!selectedProduct) {
      return;
    }

    setSavingVariant(true);
    setError(null);
    setMessage(null);

    try {
      await deleteVariant(selectedProduct.id, variant.id);
      setSelectedProduct(await getProduct(selectedProduct.id));
      if (editingVariantId === variant.id) {
        setEditingVariantId(null);
      }
      setMessage('Đã xoá phiên bản.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xoá phiên bản.'));
    } finally {
      setSavingVariant(false);
    }
  }

  return (
    <main>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>Danh mục sản phẩm</h1>
          <p style={descriptionStyle}>
            Quản lý sản phẩm, SKU, giá và tồn kho qua API /v1/catalog/products.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedProduct(null);
            setEditingVariantId(null);
            setProductForm(emptyProductForm);
          }}
          style={secondaryButtonStyle}
        >
          Tạo sản phẩm mới
        </button>
      </header>

      {error ? (
        <p role="alert" style={alertStyle}>
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" style={successStyle}>
          {message}
        </p>
      ) : null}

      <div style={layoutStyle}>
        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={sectionTitleStyle}>Sản phẩm</h2>
            <button
              type="button"
              onClick={() => void loadProducts()}
              disabled={loading}
              style={secondaryButtonStyle}
            >
              {loading ? 'Đang tải...' : 'Tải lại'}
            </button>
          </div>

          {loading ? (
            <p style={mutedStyle}>Đang tải sản phẩm...</p>
          ) : products.length === 0 ? (
            <p style={emptyStyle}>Chưa có sản phẩm nào.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => void selectProduct(product.id)}
                  style={{
                    ...productButtonStyle,
                    borderColor:
                      product.id === selectedProduct?.id ? '#2563eb' : '#e2e8f0',
                    background:
                      product.id === selectedProduct?.id ? '#eff6ff' : '#ffffff',
                  }}
                >
                  <span style={{ fontWeight: 800 }}>{product.title}</span>
                  <span style={mutedStyle}>
                    {formatStatus(product.status)} - cập nhật{' '}
                    {formatDateTime(product.updatedAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={sectionTitleStyle}>
            {selectedProduct ? 'Sửa sản phẩm' : 'Tạo sản phẩm'}
          </h2>
          <form onSubmit={(event) => void handleProductSubmit(event)}>
            <label style={labelStyle}>
              Tên sản phẩm
              <input
                value={productForm.title}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              Mô tả
              <textarea
                value={productForm.description}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={4}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              Trạng thái
              <select
                value={productForm.status}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    status: event.target.value as ProductStatus,
                  }))
                }
                style={inputStyle}
              >
                <option value="active">Đang bán</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </label>
            <div style={buttonRowStyle}>
              <button
                type="submit"
                disabled={savingProduct}
                style={primaryButtonStyle}
              >
                {savingProduct ? 'Đang lưu...' : 'Lưu sản phẩm'}
              </button>
              {selectedProduct ? (
                <button
                  type="button"
                  onClick={() => void handleDeleteProduct()}
                  disabled={savingProduct}
                  style={dangerButtonStyle}
                >
                  Xoá
                </button>
              ) : null}
            </div>
          </form>

          <hr style={dividerStyle} />

          <h2 style={sectionTitleStyle}>Phiên bản / SKU</h2>
          {!selectedProduct ? (
            <p style={emptyStyle}>Chọn hoặc tạo sản phẩm trước khi thêm SKU.</p>
          ) : (
            <>
              <form onSubmit={(event) => void handleVariantSubmit(event)}>
                <div style={variantFormGridStyle}>
                  <label style={labelStyle}>
                    SKU
                    <input
                      value={variantForm.sku}
                      onChange={(event) =>
                        setVariantForm((current) => ({
                          ...current,
                          sku: event.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </label>
                  <label style={labelStyle}>
                    Tên phiên bản
                    <input
                      value={variantForm.title}
                      onChange={(event) =>
                        setVariantForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </label>
                  <label style={labelStyle}>
                    Giá VND
                    <input
                      inputMode="numeric"
                      value={variantForm.priceVnd}
                      onChange={(event) =>
                        setVariantForm((current) => ({
                          ...current,
                          priceVnd: event.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </label>
                  <label style={labelStyle}>
                    Tồn kho
                    <input
                      min={0}
                      type="number"
                      value={variantForm.stockQty}
                      onChange={(event) =>
                        setVariantForm((current) => ({
                          ...current,
                          stockQty: Number(event.target.value),
                        }))
                      }
                      style={inputStyle}
                    />
                  </label>
                </div>
                <div style={buttonRowStyle}>
                  <button
                    type="submit"
                    disabled={savingVariant}
                    style={primaryButtonStyle}
                  >
                    {savingVariant
                      ? 'Đang lưu...'
                      : editingVariantId
                        ? 'Lưu SKU'
                        : 'Thêm SKU'}
                  </button>
                  {editingVariantId ? (
                    <button
                      type="button"
                      onClick={() => setEditingVariantId(null)}
                      style={secondaryButtonStyle}
                    >
                      Huỷ sửa
                    </button>
                  ) : null}
                </div>
              </form>

              {(selectedProduct.variants ?? []).length === 0 ? (
                <p style={emptyStyle}>Sản phẩm chưa có SKU.</p>
              ) : (
                <div style={{ marginTop: 18, overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={tableHeaderStyle}>SKU</th>
                        <th style={tableHeaderStyle}>Tên</th>
                        <th style={tableHeaderStyle}>Giá</th>
                        <th style={tableHeaderStyle}>Tồn</th>
                        <th style={tableHeaderStyle}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedProduct.variants ?? []).map((variant) => (
                        <tr key={variant.id}>
                          <td style={tableCellStyle}>{variant.sku}</td>
                          <td style={tableCellStyle}>{variant.title}</td>
                          <td style={tableCellStyle}>
                            {formatMoney(variant.priceVnd)}
                          </td>
                          <td style={tableCellStyle}>{variant.stockQty}</td>
                          <td style={tableCellStyle}>
                            <button
                              type="button"
                              onClick={() => setEditingVariantId(variant.id)}
                              style={linkButtonStyle}
                            >
                              Sửa
                            </button>{' '}
                            <button
                              type="button"
                              onClick={() => void handleDeleteVariant(variant)}
                              style={{ ...linkButtonStyle, color: '#b91c1c' }}
                            >
                              Xoá
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function getApiErrorMessage(err: unknown, fallback: string) {
  return err instanceof ApiClientError ? err.message : fallback;
}

function formatStatus(status: ProductStatus) {
  return status === 'active' ? 'Đang bán' : 'Lưu trữ';
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatMoney(value: string) {
  return new Intl.NumberFormat('vi-VN', {
    currency: 'VND',
    style: 'currency',
  }).format(Number(value));
}

const headerStyle: CSSProperties = {
  alignItems: 'flex-start',
  display: 'flex',
  gap: 16,
  justifyContent: 'space-between',
};

const descriptionStyle: CSSProperties = {
  color: '#475569',
  fontSize: 18,
  maxWidth: 760,
};

const layoutStyle: CSSProperties = {
  alignItems: 'start',
  display: 'grid',
  gap: 24,
  gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)',
  marginTop: 28,
};

const panelStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 20,
};

const panelHeaderStyle: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  gap: 12,
  justifyContent: 'space-between',
  marginBottom: 16,
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 22,
  margin: '0 0 16px',
};

const productButtonStyle: CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  color: '#0f172a',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 14,
  textAlign: 'left',
};

const labelStyle: CSSProperties = {
  color: '#334155',
  display: 'flex',
  flexDirection: 'column',
  fontSize: 14,
  fontWeight: 700,
  gap: 6,
  marginTop: 14,
};

const inputStyle: CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  color: '#0f172a',
  font: 'inherit',
  padding: '11px 12px',
};

const variantFormGridStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
};

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  marginTop: 18,
};

const primaryButtonStyle: CSSProperties = {
  background: '#2563eb',
  border: 'none',
  borderRadius: 10,
  color: '#ffffff',
  cursor: 'pointer',
  fontSize: 15,
  fontWeight: 800,
  padding: '11px 16px',
};

const secondaryButtonStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  color: '#0f172a',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 700,
  padding: '9px 12px',
};

const dangerButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  color: '#b91c1c',
};

const linkButtonStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#2563eb',
  cursor: 'pointer',
  font: 'inherit',
  fontWeight: 800,
  padding: 0,
};

const dividerStyle: CSSProperties = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '28px 0',
};

const tableStyle: CSSProperties = {
  borderCollapse: 'collapse',
  minWidth: 680,
  width: '100%',
};

const tableHeaderStyle: CSSProperties = {
  borderBottom: '1px solid #e2e8f0',
  color: '#334155',
  fontSize: 14,
  fontWeight: 700,
  padding: '12px 16px',
  textAlign: 'left',
};

const tableCellStyle: CSSProperties = {
  borderBottom: '1px solid #f1f5f9',
  color: '#0f172a',
  fontSize: 15,
  padding: '12px 16px',
};

const mutedStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 14,
};

const emptyStyle: CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  color: '#64748b',
  padding: 16,
};

const alertStyle: CSSProperties = {
  color: '#b91c1c',
  fontSize: 16,
  marginTop: 20,
};

const successStyle: CSSProperties = {
  color: '#15803d',
  fontSize: 16,
  marginTop: 20,
};
