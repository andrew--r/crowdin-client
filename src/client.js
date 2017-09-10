import fs from 'fs';
import request from 'request';
import { URL } from 'url';

function getInfoFile(source, name, type = 'file') {
  const files = source ? source.files : null;
  if (files) {
    return files.find(item => item.node_type === type && item.name === name);
  }
  return null;
}

export default class Crowdin {
  constructor(options) {
    this.options = options;
    if (!options.project) {
      throw new Error('Key `project` should be specified and contained crowdin project ID.');
    }
    if (!options.key) {
      throw new Error(
        'Key `key` should be specified and contained crowdin API key.\n' +
        `Check https://crowdin.com/project/${options.project}/settings#api`,
      );
    }
  }

  getEndpointUrl(path, params) {
    const { project, key } = this.options;
    const endpointUrl = new URL(`https://api.crowdin.com/api/project/${project}/${path}`);
    endpointUrl.searchParams.set('json', 1);
    endpointUrl.searchParams.set('key', key);
    if (params) {
      Object.keys(params).map(name => endpointUrl.searchParams.set(name, params[name]));
    }
    return endpointUrl;
  }

  request(method, name, params, formData, callback) {
    return request({
      uri: this.getEndpointUrl(name, params),
      method,
      formData,
      encoding: null,
    }, callback);
  }

  promiseJSON(method, name, params, formData) {
    return new Promise((resolve, reject) => {
      this.request(method, name, params, formData, (err, httpResponse, buffer) => {
        if (err) {
          return reject(err);
        }

        if (httpResponse.statusCode === 200) {
          return resolve(JSON.parse(buffer.toString('utf8')));
        }

        try {
          return reject(JSON.parse(buffer.toString('utf8')));
        } catch (ex) {
          return reject(new Error(`Bad http status code: ${httpResponse.statusCode}`));
        }
      });
    });
  }

  promiseStream(method, name, params, formData) {
    return new Promise((resolve, reject) => {
      this.request(method, name, params, formData, (err, httpResponse, buffer) => {
        if (err) {
          return reject(err);
        }

        if (httpResponse.statusCode === 200) {
          return resolve(buffer);
        }

        try {
          return reject(JSON.parse(buffer.toString('utf8')));
        } catch (ex) {
          return reject(new Error(`Bad http status code: ${httpResponse.statusCode}`));
        }
      });
    });
  }

  addFile(data) {
    return this.promiseJSON('POST', 'add-file', null, data);
  }

  createBranch(name) {
    return this.promiseJSON('POST', 'add-directory', {
      name,
      is_branch: 1,
    });
  }

  updateFile(data) {
    return this.promiseJSON('POST', 'update-file', null, data);
  }

  deleteFile(data) {
    return this.promiseJSON('POST', 'delete-file', null, data);
  }

  uploadFile(data) {
    return this.promiseJSON('POST', 'upload-translation', null, data);
  }

  translationStatus(data) {
    return this.promiseJSON('POST', 'status', null, data);
  }

  languageStatus(data) {
    return this.promiseJSON('POST', 'language-status', null, data);
  }

  info() {
    return this.promiseJSON('POST', 'info');
  }

  exportFile(data, callback) {
    return this.promiseStream('GET', 'export-file', data, null, callback);
  }

  exportTranslations(data, callback) {
    return this.promiseStream('GET', 'export', data, null, callback);
  }

  preTranslate(data) {
    return this.promiseStream('POST', 'pre-translate', null, data);
  }

  downloadTranslations(pckg = 'all', branch, callback) {
    if (!branch) {
      return this.promiseStream('GET', `download/${pckg}.zip`, null, null, callback);
    }

    return this.exportTranslations({ branch }).then(() => (
      this.promiseStream('GET', `download/${pckg}.zip`, { branch }, null, callback)
    ), callback).catch(callback);
  }

  createOrUpdateVersionedFile(branchName, fileName, path, pattern) {
    return this.info().then((info) => {
      const branch = getInfoFile(info, branchName, 'branch');
      const formData = {
        [`files[${fileName}]`]: fs.createReadStream(path),
        [`export_patterns[${fileName}]`]: pattern,
        branch: branchName,
      };

      if (branch) {
        return getInfoFile(branch, fileName) ? this.updateFile(formData) : this.addFile(formData);
      }

      return this.createBranch(branchName).then(() => this.addFile(formData));
    });
  }
}
