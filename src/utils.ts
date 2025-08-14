export function getStr(string: string | String, start: string, end: string) { // get part of stringg passing start and end
  var str
  var canSplit = function (str: string | String, token: string) {
    return (str || '').split(token).length > 1;
  }
  if (canSplit(string, start)) {
    str = string.split(start);
    if (end) {
      str = str[1]?.split(end);
      return str?.[0];
    } else { return str = str[1]; }

  } else { return "" }
}


export function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

export function isError(error: any): error is NodeJS.ErrnoException {
  return error instanceof Error;
}


type TFindKeyObj = any
export function findKey<T>(obj: TFindKeyObj, key: string): T | null {
  for (const k in obj) {
    if (k === key) {
      return obj[k];
    }
    if (typeof obj[k] === 'object') {
      const value = findKey(obj[k], key);
      if (value) {
        return value as T
      }
    }
  }
  return null;
}


export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends Record<string, any> ? RecursivePartial<T[P]> : T[P];
};
export function mergeObjects<T extends Record<string, any>>(
  existingObj: T,
  newObj: RecursivePartial<T>
) {
  for (const key in newObj) {
    if (newObj?.hasOwnProperty && newObj.hasOwnProperty(key)) {
      if (typeof newObj[key] === 'object' && newObj[key] !== null && !Array.isArray(newObj[key])) {
        existingObj[key] = mergeObjects(
          existingObj[key] || {},
          newObj[key] as T[typeof key]
        ) as T[typeof key];
      } else {
        existingObj[key] = newObj[key] as T[typeof key];
      }
    }
  }
  return existingObj;
}