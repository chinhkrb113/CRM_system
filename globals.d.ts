
import * as LucideReactTypes from 'lucide-react';
import * as D3Types from 'd3';
import { cva as cvaFn, type VariantProps } from 'class-variance-authority';
import { clsx as clsxFn, type ClassValue } from 'clsx';
import { twMerge as twMergeFn } from 'tailwind-merge';

declare global {
  // These are exposed by the CDN scripts in index.html
  var LucideReact: typeof LucideReactTypes;
  var d3: typeof D3Types;
  // These are for mocking libraries that would normally be installed
  var cva: typeof cvaFn;
  var clsx: typeof clsxFn;
  var twMerge: typeof twMergeFn;
}
