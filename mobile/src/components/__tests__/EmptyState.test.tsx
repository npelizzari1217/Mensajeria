import React from 'react';
import renderer from 'react-test-renderer';
import type { ReactTestRendererNode } from 'react-test-renderer';

import { EmptyState } from '../EmptyState';

// Prueba de humo del render: confirma que el arbol de React Native se monta y
// que el mensaje llega a la pantalla. No valida estilos.
//
// Los textos se juntan recorriendo el JSON del arbol en vez de usar
// findAllByType(Text): esa API pide un ElementType que el tipado de
// react-test-renderer no acepta para los componentes de React Native.
//
// El nodo se tipa como ReactTestRendererNode, no como el retorno de toJSON():
// ese retorno no incluye string, pero `children` si los trae, y son las hojas
// de texto que este helper viene a juntar.

type Nodo = ReactTestRendererNode | ReactTestRendererNode[] | null;

function textosDe(nodo: Nodo): string[] {
  if (nodo == null) return [];
  if (typeof nodo === 'string') return [nodo];
  if (Array.isArray(nodo)) return nodo.flatMap(textosDe);
  return (nodo.children ?? []).flatMap(textosDe);
}

describe('EmptyState', () => {
  it('monta y muestra el mensaje por defecto', () => {
    const arbol = renderer.create(<EmptyState />).toJSON();
    expect(textosDe(arbol)).toContain('No hay elementos para mostrar');
  });

  it('muestra el mensaje que recibe por props', () => {
    const arbol = renderer.create(<EmptyState message="Bandeja vacia" />).toJSON();
    expect(textosDe(arbol)).toContain('Bandeja vacia');
  });
});
