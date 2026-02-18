type Entity = {
  id: string;
};

type Constructor<T> = new (...args: any[]) => T;

export class Registry {
  #components = new Map<Constructor<any>, Map<string, any>>();

  #addComponent<T>(entityId: string, component: T) {
    const type = component.constructor as Constructor<T>;
    if (!this.#components.has(type)) this.#components.set(type, new Map());
    this.#components.get(type)!.set(entityId, component);
  }

  addComponents(entityId: string, components: any[]) {
    for (const component of components) {
      this.#addComponent(entityId, component);
    }
  }

  query<T extends any[]>(...types: { [K in keyof T]: Constructor<T[K]> }): T[] {
    const [first, ...others] = types;
    const firstMap = this.#components.get(first);
    if (!firstMap) return [];

    return Array.from(firstMap.keys())
      .filter((id) =>
        others.every((type) => this.#components.get(type)?.has(id)),
      )
      .map(
        (id) => types.map((type) => this.#components.get(type)!.get(id)) as T,
      );
  }

  queryWithIds<T extends any[]>(
    ...types: { [K in keyof T]: Constructor<T[K]> }
  ): [string, ...T][] {
    const [first, ...others] = types;
    const firstMap = this.#components.get(first);
    if (!firstMap) return [];

    return Array.from(firstMap.keys())
      .filter((id) =>
        others.every((type) => this.#components.get(type)?.has(id)),
      )
      .map(
        (id) =>
          [id, ...types.map((type) => this.#components.get(type)!.get(id))] as [
            string,
            ...T,
          ],
      );
  }

  deleteEntity(entityId: string) {
    for (const componentMap of this.#components.values()) {
      componentMap.delete(entityId);
    }
  }

  removeComponent<T>(entityId: string, type: Constructor<T>) {
    const componentMap = this.#components.get(type);
    if (componentMap) {
      componentMap.delete(entityId);
    }
  }

  getAllEntities(): Set<string> {
    const entities = new Set<string>();
    for (const componentMap of this.#components.values()) {
      for (const entityId of componentMap.keys()) {
        entities.add(entityId);
      }
    }
    return entities;
  }
}
