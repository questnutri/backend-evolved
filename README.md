# QuestnutriBackendEvolved

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/nx-api/node?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Run tasks

To run the dev server for your app, use:

```sh
npx nx serve auth-svc
```

To create a production bundle:

```sh
npx nx build auth-svc
```

To see all available targets to run for a project, run:

```sh
npx nx show project auth-svc
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/node:app demo
```

To generate a new library, use:

```sh
npx nx g @nx/node:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/nx-api/node?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)


# CREATE NEW SERVICE:
nx g @nx/nest:app apps/my-nest-app

# CREATE NEW LIBRARY:
nx g @nx/nest:lib libs/shared 

# RUN ALL:
nx run-many --target=serve --all

# RUN SPECIFIC SERVICE:
nx serve auth-svc

# RUN SOME SERVICES:
nx run-many -t serve -p auth-svc,another-svc,...

# HELM CONFIG:
helm upgrade --install questnutri ./helm/


//Meal record trigger
{
  "trackId": "{{track_id}}",
  "listenerId": "{{listener_id}}",
  "conditions": [
    {
      "foundAt": "statusCode",
      "propertyType": "number",
      "conditionOperation": "EQUAL",
      "value": "201"
    },
    {
      "foundAt": "user",
      "mappedBy": "role",
      "propertyType": "string",
      "conditionOperation": "EQUAL",
      "value": "patient"
    },
    {
      "foundAt": "data",
      "mappedBy": "createdAt",
      "propertyType": "date",
      "conditionOperation": "EQUAL",
      "compare": {
        "foundAt": "data",
        "mappedBy": "updatedAt"
      }
    }
  ]
}

//Login record trigger
{
    "trackId": "{{track_id}}",
    "listenerId": "{{listener_id}}",
    "conditions": [
        {
            "foundAt": "statusCode",
            "propertyType": "number",
            "conditionOperation": "EQUAL",
            "value": "200"
        },
        {
            "foundAt": "user",
            "mappedBy": "role",
            "propertyType": "string",
            "conditionOperation": "EQUAL",
            "value": "patient"
        },
        {
            "foundAt": "timestamp",
            "propertyType": "date",
            "conditionOperation": "GREATER_THAN",
            "applyOperationOnDate": "day",
            "compare": {
                "foundAt": "trackRecord",
                "mappedBy": "lastUpdatedAt"
            }
        }
    ]
}

{
    "trackId": "{{track_id}}",
    "listenerId": "{{listener_id}}",
    "conditions": [
        {
            "foundAt": "timestamp",
            "propertyType": "date",
            "conditionOperation": "GREATER_THAN",
            "applyOperationOnDate": "day",
            "compare": {
                "foundAt": "trackRecord",
                "mappedBy": "lastUpdatedAt"
            }
        },
      {
        "foundAt": "data",
        "mappedBy": "totalIntake",
        "propertyType": "number",
        "conditionOperation": "GREATER_OR_EQUAL",
        "compare": {
          "foundAt": "data",
          "mappedBy": "currentDailyWaterGoal"
        }
      }
    ]
}

{
    "trackId": "{{track_id}}",
    "listenerId": "{{listener_id}}",
    "conditions": [
        {
            "foundAt": "timestamp",
            "propertyType": "date",
            "conditionOperation": "GREATER_THAN",
            "applyOperationOnDate": "day",
            "compare": {
                "foundAt": "trackRecord",
                "mappedBy": "lastUpdatedAt"
            }
        },
      {
        "foundAt": "data",
        "mappedBy": "totalIntake",
        "propertyType": "number",
        "conditionOperation": "GREATER_OR_EQUAL",
        "compare": {
          "foundAt": "data",
          "mappedBy": "currentDailyWaterGoal"
        }
      }
    ]
}




//   "configuration": {
//       "type": "COUNTER",
//       "updateOperation": "ADD",
//       "trackPropertyType": "number",
//       "updateValue": "1",
//       "initialValue": "1"
//   }
// {
//   "name": "Patient's meal records",
//   "description": "Track patient records",
//   "configuration": {
//     "type": "PROPERTY",
//     "updateOperation": "SET",
//     "trackPropertyType": "string",
//     "computedValue": {
//       "foundAt": "data",
//       "mappedBy": "id",
//       "type": "string"
//     }
//   }
// }
// "userId": "abc"
// TrackRecord => 123abc >> TrackTemplate.achievement? > P/ cada AchievementTemplate => AchievementTemplate.targetValue == TrackRecord.currentValue >> AchievementRecord => 
//AchievementTemplate id = "xyz"
//AchievementRecord => xyzabc
//Lucas, usuario abc, desbloqueou AchievementTemplate.id >> notification-svc

// https://questnutri.com.br/api/v1/nofication/me
// https://questnutri.com.br/api/v1/notifation/:id/ack
//id do usuario, severity: info, warn, error, success, message

// PatientLogin => abc
// | id | value: number |

// PatientMealRecord => 123
// | id | value: string |


// TrackTemplate
// | id      | propertyType |
// +---------+--------------+
// | abc     | number       | => PatientLogic
// | 123     | string       | => PatientMealRecord


// TrackRecord
// | trackId | userId | currentValue |
// +---------+--------+--------------+
// | abc     | xyz    | "1"          |
// | abc     | 456    | "3"          |
// | 123     | xyz    | "test"       |