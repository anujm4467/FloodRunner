import React from "react";
import { useFloodRunner } from "../../Contexts/floodrunner-context";
import { Form, Button, Icon, Message } from "semantic-ui-react";
import { Formik } from "formik";
import * as yup from "yup";
import Modal from "../Shared/Modal/Modal";
import { CreateFloodTest } from "../../Models/Api/FloodTest";
import _ from "lodash";
import history from "../../Utils/history";

interface IProps {
  createFloodTest: CreateFloodTest;
  closeModal: () => void;
  maximumTestsReached: boolean;
}

const FILE_SIZE = 50000;
const SUPPORTED_FORMATS = ["text/plain", "video/mp2ts"];
const SUPPORED_EXT = ["ts"];

const FloodCreateForm = ({
  createFloodTest,
  closeModal,
  maximumTestsReached,
}: IProps) => {
  const { createTest } = useFloodRunner();

  const renderBetaWarning = () => {
    return (
      <Message warning>
        <Icon name="warning" />
        During the Beta you can only schedule 1 Flood Element Test. Please
        delete your other test in order to create a new test.
      </Message>
    );
  };

  return (
    <Formik
      initialValues={{
        name: createFloodTest.name,
        description: createFloodTest.description,
        interval: createFloodTest.interval,
        script: null,
      }}
      validationSchema={yup.object().shape({
        name: yup
          .string()
          .required("Name cannot be empty")
          .max(50, "Maximum characters cannot exceed 50"),
        description: yup
          .string()
          .max(100, "Maximum characters cannot exceed 100")
          .required("Description cannot be empty"),
        interval: yup
          .number()
          .min(60, "Minimum interval is 60 minutes during Beta")
          .test(
            "interval-multiple",
            "Interval must be a multiple of 10 minutes",
            function (value) {
              return value % 10 === 0;
            }
          )
          .required("Interval is required"),
        script: yup
          .mixed()
          .required("Please upload a test script")
          .test(
            "script-fileSize",
            `File size too large (max size is 50Kb)`,
            (value) => (value == null ? false : value.size <= FILE_SIZE)
          )
          // .test(
          //   "script-fileType",
          //   `Unsupported file format (only "text/plain" and "video/mp2ts" supported)`,
          //   (value) => {
          //     console.log(value.type);
          //     return value == null
          //       ? false
          //       : SUPPORTED_FORMATS.includes(value.type);
          //   }
          // )
          .test("script-fileExt", "Unsupported file type", (value) =>
            value == null
              ? false
              : SUPPORED_EXT.includes(value.name.split(".").pop())
          ),
      })}
      onSubmit={async (values, actions) => {
        var createTestDto: CreateFloodTest = {
          name: values.name,
          description: values.description,
          interval: values.interval,
          testScript: values.script,
          userId: null,
        };

        await createTest(createTestDto);
        actions.setSubmitting(false);
        closeModal();
        history.go(0); //reload page to show new test
      }}
      render={({
        values,
        errors,
        handleChange,
        handleSubmit,
        isSubmitting,
        dirty,
        setFieldValue,
      }) => (
        <Modal
          title="Create scheduled test"
          content={
            maximumTestsReached ? (
              renderBetaWarning()
            ) : (
              <>
                {errors.name && <Message error content={errors.name} />}
                {errors.description && (
                  <Message error content={errors.description} />
                )}
                {errors.interval && <Message error content={errors.interval} />}
                {errors.script && <Message error content={errors.script} />}

                <Form loading={isSubmitting} onSubmit={handleSubmit}>
                  <Form.Input
                    required
                    label="Name"
                    fluid
                    type="text"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    error={errors.name !== undefined}
                  />
                  <Form.TextArea
                    label="Description"
                    type="text"
                    name="description"
                    required
                    value={values.description}
                    onChange={handleChange}
                    rows={1}
                    error={errors.description !== undefined}
                  />
                  <Form.Input
                    required
                    label="Interval (minutes)"
                    fluid
                    type="text"
                    name="interval"
                    value={values.interval}
                    onChange={handleChange}
                    error={errors.interval !== undefined}
                  />
                  <Form.Input
                    required
                    label="Test Script (.ts file)"
                    fluid
                    type="file"
                    name="script"
                    onChange={(event) => {
                      setFieldValue("script", event.currentTarget.files[0]);
                    }}
                    error={errors.script !== undefined}
                  />
                  <Button
                    primary
                    type="submit"
                    loading={isSubmitting}
                    disabled={isSubmitting || !_.isEmpty(errors) || !dirty}
                    floated="right"
                  >
                    Create
                  </Button>
                  <Button
                    onClick={() => (dirty ? closeModal() : closeModal())}
                    floated="right"
                  >
                    Cancel
                  </Button>
                </Form>
              </>
            )
          }
          onDismiss={closeModal}
        />
      )}
    />
  );
};

export default FloodCreateForm;
